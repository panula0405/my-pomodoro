import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).parent.parent / "pomodoro.db"


def initialize_database():
    connection = sqlite3.connect(DATABASE_PATH)

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                timer_minutes REAL NOT NULL,
                short_break_minutes REAL NOT NULL,
                long_break_minutes REAL NOT NULL,
                batch_size INTEGER NOT NULL
            )
            """
        )
        existing_columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(settings)"
            ).fetchall()
        }

        if "short_break_minutes" not in existing_columns:
            connection.execute(
                """
                ALTER TABLE settings
                ADD COLUMN short_break_minutes
                REAL NOT NULL DEFAULT 5
                """
            )

        if "long_break_minutes" not in existing_columns:
            connection.execute(
                """
                ALTER TABLE settings
                ADD COLUMN long_break_minutes
                REAL NOT NULL DEFAULT 15
                """
            )

        connection.execute(
            """
            INSERT OR IGNORE INTO settings (
                id,
                timer_minutes,
                short_break_minutes,
                long_break_minutes,
                batch_size
            )
            VALUES (1, 25, 5, 15, 3)
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL CHECK (
                    priority IN ('low', 'medium', 'high')
                ),
                estimated_pomodoros INTEGER NOT NULL CHECK (
                    estimated_pomodoros >= 1
                ),
                position INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'todo' CHECK (
                    status IN ('todo', 'in_progress', 'done')
                ),
                planned_date TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.commit()
    finally:
        connection.close()

def read_settings():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    try:
        row = connection.execute(
            """
            SELECT timer_minutes, short_break_minutes, long_break_minutes, batch_size
            FROM settings
            WHERE id = 1
            """
        ).fetchone()

        return {
            "timer_minutes": row["timer_minutes"],
            "short_break_minutes": row["short_break_minutes"],
            "long_break_minutes": row["long_break_minutes"],
            "batch_size": row["batch_size"],
        }
    finally:
        connection.close()

def write_settings(
    timer_minutes: float,
    short_break_minutes: float,
    long_break_minutes: float,
    batch_size: int,
):
    connection = sqlite3.connect(DATABASE_PATH)

    try:
        connection.execute(
            """
            UPDATE settings
            SET
                timer_minutes = ?,
                short_break_minutes = ?,
                long_break_minutes = ?,
                batch_size = ?
            WHERE id = 1
            """,
            (
                timer_minutes,
                short_break_minutes,
                long_break_minutes,
                batch_size,
            ),
        )
        connection.commit()
    finally:
        connection.close()

def create_task(
    title: str,
    description: str,
    priority: str,
    estimated_pomodoros: int,
    position: int,
    planned_date: str,
):
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    try:
        cursor = connection.execute(
            """
            INSERT INTO tasks (
                title,
                description,
                priority,
                estimated_pomodoros,
                position,
                planned_date
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                title,
                description,
                priority,
                estimated_pomodoros,
                position,
                planned_date,
            ),
        )

        connection.commit()

        row = connection.execute(
            """
            SELECT
                id,
                title,
                description,
                priority,
                estimated_pomodoros,
                position,
                status,
                planned_date,
                created_at
            FROM tasks
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

        return dict(row)
    finally:
        connection.close()

def read_tasks(planned_date: str):
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    try:
        rows = connection.execute(
            """
            SELECT
                id,
                title,
                description,
                priority,
                estimated_pomodoros,
                position,
                status,
                planned_date,
                created_at
            FROM tasks
            WHERE planned_date = ?
            ORDER BY position ASC, id ASC
            """,
            (planned_date,),
        ).fetchall()

        return [dict(row) for row in rows]
    finally:
        connection.close()

def update_task_status(task_id: int, status: str):
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    try:
        connection.execute(
            """
            UPDATE tasks
            SET status = ?
            WHERE id = ?
            """,
            (status, task_id),
        )

        connection.commit()

        row = connection.execute(
            """
            SELECT
                id,
                title,
                description,
                priority,
                estimated_pomodoros,
                position,
                status,
                planned_date,
                created_at
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()

        return dict(row) if row else None
    finally:
        connection.close()

def delete_task(task_id: int):
    connection = sqlite3.connect(DATABASE_PATH)

    try:
        cursor = connection.execute(
            """
            DELETE FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        )

        connection.commit()

        return cursor.rowcount > 0
    finally:
        connection.close()
