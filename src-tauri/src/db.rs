use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use tokio::sync::OnceCell;

use crate::{error::LsarResult, history::HistoryItem};

type SqlitePool = Pool<Sqlite>;

static SQLITE_POOL: OnceCell<SqlitePool> = OnceCell::const_new();

async fn get_global_pool() -> &'static SqlitePool {
    SQLITE_POOL
        .get_or_init(|| async {
            SqlitePoolOptions::new()
                .max_connections(5)
                .connect("./lsar.db?mode=rwc")
                .await
                .map_err(|e| {
                    error!(message = "数据库连接池中获取链接失败", error = ?e);
                    e
                })
                .unwrap()
        })
        .await
}

async fn create_history_table(pool: &SqlitePool) -> LsarResult<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS history (
                id              INTEGER PRIMARY KEY,
                platform        INTEGER NOT NULL,
                room_id         INTEGER NOT NULL,
                anchor          VARCHAR(40) NOT NULL,
                category        VARCHAR(40) NOT NULL,
                last_title      VARCHAR(40) NOT NULL,
                last_play_time  DATETIME NOT NULL
            )",
    )
    .execute(pool)
    .await
    .map_err(|e| {
        error!(message = "创建表格失败", error = ?e);
        e
    })?;

    info!(message = "已创建表格（如果表格不存在）", table = "history");

    Ok(())
}

#[tauri::command]
pub async fn create_table() -> LsarResult<()> {
    trace!(message = "创建表格");

    let pool = get_global_pool().await;

    create_history_table(pool).await?;

    Ok(())
}

#[tauri::command]
pub async fn get_all_history() -> LsarResult<Vec<HistoryItem>> {
    trace!(message = "获取全部历史记录");

    let pool = get_global_pool().await;

    let rows: Vec<(i64, i8, i64, String, String, String, time::OffsetDateTime)> = sqlx::query_as(
        "select id, platform, room_id, anchor, category, last_title, last_play_time
from history
order by last_play_time desc;",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(message = "获取全部历史记录失败", error = ?e);
        e
    })?;

    Ok(rows.into_iter().map(|item| item.into()).collect())
}

#[tauri::command]
pub async fn delete_a_history_by_id(id: i64) -> LsarResult<()> {
    trace!(message = "删除一条历史记录");

    let pool = get_global_pool().await;

    let row: (i64,) = sqlx::query_as("select count(*) from history where id = ?")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!(message = "获取全部历史记录失败", error = ?e);
            e
        })?;

    if row.0 == 0 {
        return Ok(());
    }

    sqlx::query(
        "delete
        from history
        where id = ?;",
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn insert_a_history(history: HistoryItem) -> LsarResult<()> {
    trace!(message = "插入一条历史记录");

    let pool = get_global_pool().await;

    let row: (i64,) =
        sqlx::query_as("select count(*) from history where platform = ? and room_id = ?")
            .bind(history.platform().as_i64())
            .bind(history.room_id())
            .fetch_one(pool)
            .await
            .map_err(|e| {
                error!(message = "获取全部历史记录失败", error = ?e);
                e
            })?;

    if row.0 > 0 {
        // 更新标题、分类、播放时间
        sqlx::query(
            "update history set category = ?, last_title = ?, last_play_time = ? where platform = ? and room_id = ?",
        )
        .bind(history.category())
        .bind(history.last_title())
        .bind(history.last_play_time())
        .bind(history.platform().as_i64())
        .bind(history.room_id())
        .execute(pool)
        .await?;

        info!(message = "已更新记录", id = row.0);
        return Ok(());
    }

    sqlx::query("insert into history(platform, room_id, anchor, category, last_title, last_play_time) VALUES(?, ?, ?, ?, ?, ?);")
        .bind(history.platform().as_i64())
        .bind(history.room_id())
        .bind( history.anchor())
        .bind(history.category())
        .bind(history.last_title())
        .bind(history.last_play_time())
        .execute(pool)
        .await?;

    Ok(())
}
