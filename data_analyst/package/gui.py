from dotenv import load_dotenv
import os
import datetime
import tkinter as tk
from tkinter import ttk, messagebox

from tkcalendar import DateEntry
from sqlalchemy import (
    create_engine,
    Table,
    MetaData,
    DateTime,
    inspect,
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Enum as SQLEnum

load_dotenv()

user     = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
host     = os.getenv("DB_HOST")
dbname   = os.getenv("DB_NAME")

engine = create_engine(
    f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}",
    connect_args={'init_command': 'SET time_zone="+07:00"'},
    echo=False
)
Session = sessionmaker(bind=engine)
metadata = MetaData()

inspector   = inspect(engine)
TABLE_NAMES = inspector.get_table_names()   # chỉ trả về các BASE TABLE

def fill_now(date_widget, hour_widget, minute_widget):
    now = datetime.datetime.now()
    date_widget.set_date(now.date())
    hour_widget.delete(0, tk.END); hour_widget.insert(0, f"{now.hour:02d}")
    minute_widget.delete(0, tk.END); minute_widget.insert(0, f"{now.minute:02d}")

class TableImporter(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Manual Table Importer")
        self.geometry("600x900")
        self.table   = None
        self.widgets = {}

        selector_frame = ttk.Frame(self, padding=10)
        selector_frame.pack(fill="x")
        ttk.Label(selector_frame, text="Choose table:", width=15).pack(side="left")
        self.table_cb = ttk.Combobox(
            selector_frame,
            values=TABLE_NAMES,
            state="readonly"
        )
        self.table_cb.pack(side="left", fill="x", expand=True)
        self.table_cb.bind("<<ComboboxSelected>>", self.on_table_change)

        self.form_frame = ttk.Frame(self, padding=20)
        self.form_frame.pack(fill="both", expand=True)

        self.insert_btn = ttk.Button(self, text="Insert Record", command=self.insert_record)
        self.insert_btn.pack(pady=20)

    def on_table_change(self, event):
        for child in self.form_frame.winfo_children():
            child.destroy()
        self.widgets.clear()

        table_name = self.table_cb.get()
        self.table = Table(table_name, metadata, autoload_with=engine)

        for col in self.table.columns:
            if col.primary_key and col.autoincrement:
                continue

            row = ttk.Frame(self.form_frame)
            row.pack(fill="x", pady=5)
            ttk.Label(row, text=col.name, width=20).pack(side="left")

            if isinstance(col.type, DateTime):
                picker = ttk.Frame(row); picker.pack(side="left", fill="x", expand=True)

                date_ent = DateEntry(picker, date_pattern='yyyy-MM-dd')
                date_ent.pack(side="left")

                hr = tk.Spinbox(picker, from_=0, to=23, width=2, format="%02.0f")
                mn = tk.Spinbox(picker, from_=0, to=59, width=2, format="%02.0f")
                hr.pack(side="left", padx=(8,0))
                ttk.Label(picker, text=":").pack(side="left")
                mn.pack(side="left")

                now_btn = ttk.Button(
                    picker, text="Now",
                    command=lambda d=date_ent, h=hr, m=mn: fill_now(d, h, m)
                )
                now_btn.pack(side="left", padx=8)

                self.widgets[col.name] = (date_ent, hr, mn)

            elif isinstance(col.type, SQLEnum):
                cb = ttk.Combobox(
                    row, values=col.type.enums,
                    state="readonly", width=30
                )
                cb.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = cb

            elif getattr(col.type, "python_type", None) is bool:
                cb = ttk.Combobox(
                    row, values=["0","1"],
                    state="readonly", width=30
                )
                cb.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = cb

            else:
                ent = ttk.Entry(row)
                ent.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = ent

    def insert_record(self):
        if not self.table:
            messagebox.showwarning("No table", "Please select a table first.")
            return

        data = {}
        for name, widget in self.widgets.items():
            if isinstance(widget, tuple):
                date_ent, hr_sb, mn_sb = widget
                date_str = date_ent.get()
                hour = hr_sb.get().zfill(2)
                minute = mn_sb.get().zfill(2)
                val = f"{date_str} {hour}:{minute}:00"
            else:
                val = widget.get().strip()

            if not val:
                messagebox.showerror("Missing Value", f"Please fill in `{name}`.")
                return

            col_obj = self.table.c[name]
            if getattr(col_obj.type, "python_type", None) is bool:
                val = int(val)

            data[name] = val

        session = Session()
        try:
            session.execute(self.table.insert(), data)
            session.commit()
            messagebox.showinfo("Success", f"Record inserted into {self.table.name}.")
            for widget in self.widgets.values():
                if isinstance(widget, tuple):
                    widget[0].set_date(datetime.date.today())
                    widget[1].delete(0, tk.END); widget[1].insert(0, "00")
                    widget[2].delete(0, tk.END); widget[2].insert(0, "00")
                elif isinstance(widget, ttk.Combobox):
                    widget.set("")
                else:
                    widget.delete(0, tk.END)
        except Exception as e:
            session.rollback()
            messagebox.showerror("DB Error", str(e))
        finally:
            session.close()

if __name__ == "__main__":
    app = TableImporter()
    app.mainloop()