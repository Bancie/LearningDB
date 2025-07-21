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
activity_log = Table(
    "ACTIVITY_LOG",
    metadata,
    autoload_with=engine
)

def fill_now(date_widget, hour_widget, minute_widget):
    now = datetime.datetime.now()
    date_widget.set_date(now.date())
    hour_widget.delete(0, tk.END); hour_widget.insert(0, f"{now.hour:02d}")
    minute_widget.delete(0, tk.END); minute_widget.insert(0, f"{now.minute:02d}")

# ─── GUI ───────────────────────────────────────────────────────────────────────
class ManualImporter(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ACTIVITY_LOG")
        self.geometry("550x900")
        self.widgets = {}

        frm = ttk.Frame(self, padding=20)
        frm.pack(fill="both", expand=True)

        for col in activity_log.columns:
            if col.primary_key and col.autoincrement:
                continue

            row = ttk.Frame(frm)
            row.pack(fill="x", pady=5)
            ttk.Label(row, text=col.name, width=20).pack(side="left")

            # 1) DateTime → calendar + spinbox giờ/phút + nút Now
            if isinstance(col.type, DateTime):
                picker = ttk.Frame(row)
                picker.pack(side="left", fill="x", expand=True)

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

            # 2) ENUM → Combobox các giá trị có sẵn
            elif isinstance(col.type, SQLEnum):
                cb = ttk.Combobox(
                    row, values=col.type.enums,
                    state="readonly", width=30
                )
                cb.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = cb

            # 3) Boolean / MySQL TINYINT(1) → Combobox ["0","1"]
            elif getattr(col.type, "python_type", None) is bool:
                cb = ttk.Combobox(
                    row, values=["0","1"],
                    state="readonly", width=30
                )
                cb.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = cb

            # 4) Các loại khác → Entry
            else:
                ent = ttk.Entry(row)
                ent.pack(side="left", fill="x", expand=True)
                self.widgets[col.name] = ent

        btn = ttk.Button(frm, text="Insert Record", command=self.insert_record)
        btn.pack(pady=20)

    def insert_record(self):
        data = {}
        for name, widget in self.widgets.items():
            # datetime‐picker
            if isinstance(widget, tuple):
                date_ent, hr_sb, mn_sb = widget
                date_str = date_ent.get()          # "YYYY-MM-DD"
                hour = hr_sb.get().zfill(2)
                minute = mn_sb.get().zfill(2)
                val = f"{date_str} {hour}:{minute}:00"
            else:
                val = widget.get().strip()

            if not val:
                messagebox.showerror("Missing Value", f"Please fill in `{name}`.")
                return

            # nếu column là boolean, chuyển "0"/"1" sang int
            col_obj = activity_log.c[name]
            if getattr(col_obj.type, "python_type", None) is bool:
                val = int(val)

            data[name] = val

        session = Session()
        try:
            session.execute(activity_log.insert(), data)
            session.commit()
            messagebox.showinfo("Success", "Record inserted.")
            # reset widget
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
    app = ManualImporter()
    app.mainloop()