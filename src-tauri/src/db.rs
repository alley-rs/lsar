use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use tokio::sync::OnceCell;

use crate::{error::LsarResult, global::APP_CONFIG_DIR, history::HistoryItem};

type SqlitePool = Pool<Sqlite>;

static SQLITE_POOL: OnceCell<SqlitePool> = OnceCell::const_new();

async fn get_global_pool() -> &'static SqlitePool {
    SQLITE_POOL
        .get_or_init(|| async {
            let db_path = APP_CONFIG_DIR.join("lsar.db");
            let uri = format!("{}?mode=rwc", db_path.display());

            info!("Initializing database connection with URI: {}", uri);

            let pool = SqlitePoolOptions::new()
                .max_connections(5)
                .connect(&uri)
                .await
                .map_err(|e| {
                    error!("Failed to connect to the database: {:?}", e);
                    e
                })
                .expect("Database connection must be established");

            create_history_table(&pool).await.unwrap();

            pool
        })
        .await
}

async fn create_history_table(pool: &SqlitePool) -> LsarResult<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS history (
            id              INTEGER PRIMARY KEY,
            platform        INTEGER NOT NULL,
            room_id         INTEGER NOT NULL,
            anchor          TEXT NOT NULL,
            category        TEXT NOT NULL,
            last_title      TEXT NOT NULL,
            last_play_time  DATETIME NOT NULL
        )",
    )
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to create history table: {:?}", e);
        e
    })?;
    info!("History table created or already exists");

    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_platform_room_id ON history (platform, room_id);")
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to create unique index: {:?}", e);
            e
        })?;
    info!("History unique index created or already exists");

    Ok(())
}

#[tauri::command]
pub async fn get_all_history() -> LsarResult<Vec<HistoryItem>> {
    debug!("Fetching all history records");

    let pool = get_global_pool().await;

    let rows: Vec<(i64, i64, i64, String, String, String, time::OffsetDateTime)> = sqlx::query_as(
        "SELECT id, platform, room_id, anchor, category, last_title, last_play_time
         FROM history
         ORDER BY last_play_time DESC;",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch all history records: {:?}", e);
        e
    })?;

    info!("Successfully fetched {} history records", rows.len());

    Ok(rows
        .into_iter()
        .map(|item| {
            item.try_into()
                .expect("Failed to convert database row to HistoryItem")
        })
        .collect())
}

#[tauri::command]
pub async fn delete_a_history_by_id(id: i64) -> LsarResult<()> {
    debug!("Attempting to delete history record with id: {}", id);

    let pool = get_global_pool().await;

    let result = sqlx::query("DELETE FROM history WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete history record: {:?}", e);
            e
        })?;

    if result.rows_affected() == 0 {
        warn!("No history record found with id: {}", id);
    } else {
        info!("Successfully deleted history record with id: {}", id);
    }

    Ok(())
}

#[tauri::command]
pub async fn insert_a_history(history: HistoryItem) -> LsarResult<()> {
    debug!(
        "Inserting or updating history record for platform: {}, room_id: {}",
        history.platform().to_str(),
        history.room_id()
    );

    let pool = get_global_pool().await;

    let result = sqlx::query(
        r#"
    INSERT INTO history (platform, room_id, anchor, category, last_title, last_play_time)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(platform, room_id) DO UPDATE SET
    category = excluded.category,
    last_title = excluded.last_title,
    last_play_time = excluded.last_play_time
    "#,
    )
    .bind(history.platform().as_i64())
    .bind(history.room_id())
    .bind(history.anchor())
    .bind(history.category())
    .bind(history.last_title())
    .bind(history.last_play_time())
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to insert or update history record: {:?}", e);
        e
    })?;

    if result.rows_affected() > 0 {
        info!(
            "Successfully inserted or updated history record for platform: {}, room_id: {}",
            history.platform().to_str(),
            history.room_id()
        );
    } else {
        warn!(
            "No changes made to history record for platform: {}, room_id: {}",
            history.platform().to_str(),
            history.room_id()
        );
    }

    Ok(())
}
