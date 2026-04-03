pub mod traffic;
pub mod breakpoints;
pub mod scripts;
pub mod tags;
pub mod filter_presets;
pub mod settings;

use rusqlite::Connection;

pub fn init_all_tables(conn: &Connection) -> rusqlite::Result<()> {
    traffic::create_table(conn)?;
    breakpoints::create_table(conn)?;
    scripts::create_table(conn)?;
    tags::create_table(conn)?;
    filter_presets::create_table(conn)?;
    settings::create_table(conn)?;
    Ok(())
}
