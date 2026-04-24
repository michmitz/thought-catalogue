#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
struct PinnedEntry {
    path: String,
    is_dir: bool,
}

#[derive(Serialize, Deserialize)]
struct AppConfig {
    folder_path: String,
    #[serde(default)]
    pinned: Vec<PinnedEntry>,
}

#[derive(Deserialize)]
struct LegacyAppConfig {
    folder_path: String,
    #[serde(default)]
    pinned_paths: Vec<String>,
}

fn get_config_path(app: &tauri::AppHandle) -> PathBuf {
  let mut path = app
      .path()
      .app_config_dir()
      .expect("Failed to get config dir");

  std::fs::create_dir_all(&path).ok();
  path.push("config.json");
  path
}

fn read_config(app: &tauri::AppHandle) -> AppConfig {
    let config_path = get_config_path(app);
    if let Ok(contents) = fs::read_to_string(config_path) {
        if let Ok(config) = serde_json::from_str::<AppConfig>(&contents) {
            return config;
        }
        if let Ok(legacy) = serde_json::from_str::<LegacyAppConfig>(&contents) {
            let pinned = legacy
                .pinned_paths
                .into_iter()
                .map(|path| PinnedEntry {
                    is_dir: PathBuf::from(&path)
                        .metadata()
                        .ok()
                        .map(|m| m.is_dir())
                        .unwrap_or(false),
                    path,
                })
                .collect();
            return AppConfig {
                folder_path: legacy.folder_path,
                pinned,
            };
        }
    }
    AppConfig {
        folder_path: String::new(),
        pinned: Vec::new(),
    }
}

fn write_config(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path(app);
    let json = serde_json::to_string(config).map_err(|e| e.to_string())?;
    fs::write(config_path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn choose_folder(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let mut config = read_config(&app);
    config.folder_path = path;
    write_config(&app, &config)
}

#[tauri::command]
fn get_saved_folder(app: tauri::AppHandle) -> Option<String> {
    let config = read_config(&app);
    if config.folder_path.is_empty() {
        None
    } else {
        Some(config.folder_path)
    }
}

#[tauri::command]
fn get_pinned(app: tauri::AppHandle) -> Vec<PinnedEntry> {
    read_config(&app).pinned
}

#[tauri::command]
fn set_pinned(app: tauri::AppHandle, pinned: Vec<PinnedEntry>) -> Result<(), String> {
    let mut config = read_config(&app);
    config.pinned = pinned;
    write_config(&app, &config)
}

#[derive(Serialize)]
struct Entry {
    name: String,
    is_dir: bool,
}

#[tauri::command]
fn read_folder(base: String, child: Option<String>) -> Result<Vec<Entry>, String> {
    let mut path = PathBuf::from(base);

    if let Some(folder) = child {
        path.push(folder);
    }

    let entries = std::fs::read_dir(&path)
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();

        if name == ".DS_Store" {
            continue;
        }

        items.push(Entry {
            name,
            is_dir: metadata.is_dir(),
        });
    }

    Ok(items)
}

#[tauri::command]
fn create_folder(base: String, name: String) -> Result<(), String> {
    let path = PathBuf::from(&base).join(name.trim());
    fs::create_dir(&path).map_err(|e| e.to_string())
}

fn validate_note_filename(name: &str) -> Result<(), String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Name cannot be empty.".into());
    }
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err("Invalid note name.".into());
    }
    Ok(())
}

#[tauri::command]
fn create_note(base: String, name: String) -> Result<(), String> {
    validate_note_filename(&name)?;
    let path = PathBuf::from(&base).join(name.trim());
    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn read_note(base: String, name: String) -> Result<String, String> {
    validate_note_filename(&name)?;
    let path = PathBuf::from(&base).join(name.trim());
    if !path.is_file() {
        return Err("Not a file.".into());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_note(base: String, name: String, content: String) -> Result<(), String> {
    validate_note_filename(&name)?;
    let path = PathBuf::from(&base).join(name.trim());
    if !path.is_file() {
        return Err("Not a file.".into());
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_note(base: String, old_name: String, new_name: String) -> Result<(), String> {
    validate_note_filename(&old_name)?;
    validate_note_filename(&new_name)?;
    let base_path = PathBuf::from(&base);
    let old_path = base_path.join(old_name.trim());
    let new_path = base_path.join(new_name.trim());
    if new_path.exists() {
        return Err("A file with that name already exists.".into());
    }
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn move_to_trash(base: String, name: String) -> Result<(), String> {
    let path = PathBuf::from(&base).join(name);
    trash::delete(&path).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            choose_folder,
            get_saved_folder,
            get_pinned,
            set_pinned,
            read_folder,
            create_folder,
            create_note,
            read_note,
            write_note,
            rename_note,
            move_to_trash,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

