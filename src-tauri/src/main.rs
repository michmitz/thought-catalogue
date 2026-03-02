#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tauri::Manager;

#[derive(Serialize, Deserialize)]
struct AppConfig {
    folder_path: String,
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

#[tauri::command]
fn choose_folder(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let config = AppConfig { folder_path: path.clone() };

    let config_path = get_config_path(&app);

    let json = serde_json::to_string(&config)
      .map_err(|e| e.to_string())?;
    fs::write(config_path, json).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_saved_folder(app: tauri::AppHandle) -> Option<String> {
    let config_path = get_config_path(&app);

    if let Ok(contents) = fs::read_to_string(config_path) {
        if let Ok(config) = serde_json::from_str::<AppConfig>(&contents) {
            return Some(config.folder_path);
        }
    }

    None
}

fn main() {
    tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init()) 
        .invoke_handler(tauri::generate_handler![
            choose_folder,
            get_saved_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

