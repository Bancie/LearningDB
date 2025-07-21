from dotenv import load_dotenv
import os
import tkinter as tk
from tkinter import ttk, messagebox

from sqlalchemy import create_engine, Table, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Enum as SQLEnum

load_dotenv()

# ─── Database setup ────────────────────────────────────────────────────────────
user     = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
host     = os.getenv("DB_HOST")
dbname   = os.getenv("DB_NAME")

# Note: remove `autoload=True` — only `autoload_with` is needed in recent SQLAlchemy
engine = create_engine(
    f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}",
    connect_args={'init_command': 'SET time_zone="+07:00"'},
    echo=False
)
Session = sessionmaker(bind=engine)

metadata = MetaData()
activity_log = Table(
    "ACTIVITY_LOG",
    metadata,
    autoload_with=engine
)

# ─── GUI ───────────────────────────────────────────────────────────────────────
class ManualImporter(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ACTIVITY_LOG Manual Entry")
        self.geometry("500x400")
        self.widgets = {}

        frm = ttk.Frame(self, padding=20)
        frm.pack(fill="both", expand=True)

        # Build one row per column (skip auto-inc PKs)
        for col in activity_log.columns:
            if col.primary_key and col.autoincrement:
                continue

            row = ttk.Frame(frm)
            row.pack(fill="x", pady=5)

            ttk.Label(row, text=col.name, width=20).pack(side="left")

            # ENUM → Combobox
            if isinstance(col.type, SQLEnum):
                cb = ttk.Combobox(
                    row,
                    values=col.type.enums,
                    state="readonly",
                    width=30
                )
                cb.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = cb

            # everything else → Entry
            else:
                ent = ttk.Entry(row)
                ent.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = ent

        # Insert button
        btn = ttk.Button(frm, text="Insert Record", command=self.insert_record)
        btn.pack(pady=20)

    def insert_record(self):
        data = {}
        # collect widget values
        for name, w in self.widgets.items():
            val = w.get().strip()
            if not val:
                messagebox.showerror("Missing Value", f"Please fill in `{name}`.")
                return
            data[name] = val

        # insert into DB
        session = Session()
        try:
            session.execute(activity_log.insert(), data)
            session.commit()
            messagebox.showinfo("Success", "Record inserted.")
            # clear inputs
            for w in self.widgets.values():
                w.set("") if isinstance(w, ttk.Combobox) else w.delete(0, tk.END)
        except Exception as e:
            session.rollback()
            messagebox.showerror("DB Error", str(e))
        finally:
            session.close()


if __name__ == "__main__":
    app = ManualImporter()
    app.mainloop()