use std::{
    path::Path,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    thread,
};

use crate::LsarResult;

fn format_size(size: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if size < KB {
        format!("{} B", size)
    } else if size < MB {
        format!("{:.2} KB", size as f64 / KB as f64)
    } else if size < GB {
        format!("{:.2} MB", size as f64 / MB as f64)
    } else {
        format!("{:.2} GB", size as f64 / GB as f64)
    }
}

#[tauri::command]
pub fn calc_cache_size() -> LsarResult<String> {
    let path = dirs::cache_dir()
        .ok_or(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "cache dir not found",
        ))?
        .join(if cfg!(target_os = "macos") {
            "lsar"
        } else if cfg!(target_os = "windows") {
            "com.alley.lsar/EBWebView"
        } else {
            // FIXME: Linux 没有测试条件，暂不支持
            return Err(std::io::Error::new(
                std::io::ErrorKind::Unsupported,
                "unsupported platform",
            )
            .into());
        });

    let total = Arc::new(AtomicU64::new(0));
    walk_parallel(&path, Arc::clone(&total))?;
    Ok(format_size(total.load(Ordering::Relaxed)))
}

fn walk_parallel(path: &Path, total: Arc<AtomicU64>) -> std::io::Result<()> {
    if path.is_dir() {
        let entries: Vec<_> = std::fs::read_dir(path)?.filter_map(|e| e.ok()).collect();

        // 子目录数量足够多时才开新线程，避免线程爆炸
        let (dirs, files): (Vec<_>, Vec<_>) = entries.into_iter().partition(|e| e.path().is_dir());

        // 文件直接累加（无锁原子操作）
        for f in &files {
            if let Ok(meta) = f.path().metadata() {
                total.fetch_add(meta.len(), Ordering::Relaxed);
            }
        }

        // 子目录：每个起一个线程（可换成线程池限制并发）
        let handles: Vec<_> = dirs
            .into_iter()
            .map(|d| {
                let t = Arc::clone(&total);
                let p = d.path();
                thread::spawn(move || {
                    let _ = walk_parallel(&p, t);
                })
            })
            .collect();

        for h in handles {
            let _ = h.join();
        }
    } else {
        if let Ok(meta) = path.metadata() {
            total.fetch_add(meta.len(), Ordering::Relaxed);
        }
    }
    Ok(())
}
