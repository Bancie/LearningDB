#!/usr/bin/env python3
import sys
import os

# Ensure Python can find your bayes.py module
sys.path.insert(0, os.path.expanduser('~/Documents/LearningDB/data_analyst/package'))

from dotenv import load_dotenv
import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
import io

import bayes as bayes_db  # this is your bayes.py

import datetime

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
from sqlalchemy import Date, DateTime

load_dotenv()  # loads DB_USER, DB_PASS, etc.

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


class BayesApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("LearningDB Database GUI")
        self.geometry("800x900")
        
        # map human-readable labels → posterior column IDs
        self.posterior_map = {
            "Learning":  1,
            "Overview":  2,
            "Practice":  3,
        }

        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=True)

        # --- TAB: Import Data ---
        imp_frame = ttk.Frame(notebook)
        notebook.add(imp_frame, text="Import Data")
        self._build_import_tab(imp_frame)
        
        # --- TAB: Activity List ---
        act_frame = ttk.Frame(notebook)
        notebook.add(act_frame, text="Activity List")
        self._ActivityList_tab(act_frame)

        # --- TAB: Update Probabilities & Status ---
        upd_frame = ttk.Frame(notebook)
        notebook.add(upd_frame, text="Update Data")
        self._build_update_tab(upd_frame)
        
        # --- TAB: View Activities ---
        view_frame = ttk.Frame(notebook)
        notebook.add(view_frame, text="View Activities")
        self._build_view_tab(view_frame)

        # --- TAB: Run Bayes ---
        run_frame = ttk.Frame(notebook)
        notebook.add(run_frame, text="Run Bayes")
        self._build_run_tab(run_frame)

    def _build_import_tab(self, parent):
        # sao chép nguyên phần UI import (selector + form + nút) vào parent
        self.table   = None
        self.widgets = {}

        selector_frame = ttk.Frame(parent, padding=10)
        selector_frame.pack(fill="x")
        ttk.Label(selector_frame, text="Choose table:", width=15).pack(side="left")
        self.table_cb = ttk.Combobox(
            selector_frame,
            values=TABLE_NAMES,
            state="readonly"
        )
        self.table_cb.pack(side="left", fill="x", expand=True)
        self.table_cb.bind("<<ComboboxSelected>>", self.on_table_change)

        self.form_frame = ttk.Frame(parent, padding=20)
        self.form_frame.pack(fill="both", expand=True)

        self.insert_btn = ttk.Button(parent, text="Insert Record", command=self.insert_record)
        self.insert_btn.pack(pady=10)

    def _build_view_tab(self, frame):
        ttk.Label(frame, text="User ID:").grid(row=0, column=0, pady=5, padx=5, sticky="e")
        self.view_user = ttk.Entry(frame)
        self.view_user.grid(row=0, column=1, pady=5)
        ttk.Button(frame, text="Load", command=self._load_view).grid(row=0, column=2, padx=5)

        cols = ["ACTIVITY_ID","ACT_NAME","Total","Learning","Overview","Practice"]
        self.view_tree = ttk.Treeview(frame, columns=cols, show="headings", height=20)
        for c in cols:
            self.view_tree.heading(c, text=c)
            self.view_tree.column(c, width=120, anchor="center")
        self.view_tree.grid(row=1, column=0, columnspan=3, sticky="nsew")
        frame.grid_rowconfigure(1, weight=1)
        frame.grid_columnconfigure((0,1,2), weight=1)

    def _load_view(self):
        user_id = self.view_user.get().strip()
        if not user_id:
            messagebox.showwarning("Input error", "Please enter a user ID.")
            return
        try:
            df = bayes_db.get_view(user_id)
        except Exception as e:
            messagebox.showerror("Error", str(e))
            return
        for i in self.view_tree.get_children():
            self.view_tree.delete(i)
        for _, row in df.iterrows():
            self.view_tree.insert("", "end", values=(
                row.ACTIVITY_ID, row.ACT_NAME,
                row.Total, row.Learning,
                row.Overview, row.Practice
            ))

    # View for all activities
    
    def _ActivityList_tab(self, frame):
        ttk.Label(frame, text="User ID:").grid(row=0, column=0, pady=5, padx=5, sticky="e")
        self.view_user_alist = ttk.Entry(frame)
        self.view_user_alist.grid(row=0, column=1, pady=5)
        ttk.Button(frame, text="Load", command=self._load_ActivityList_tab).grid(row=0, column=2, padx=5)

        cols = ["ACTIVITY_ID","ACT_NAME","ACT_STATUS"]
        self.view_tree_alist = ttk.Treeview(frame, columns=cols, show="headings", height=20)
        # for c in cols:
        #     a = "center" if c=="ACTIVITY_ID" else "w"
        #     self.view_tree_alist.heading(c, text=c, anchor=a)
        #     self.view_tree_alist.column( c, width=120, anchor=a)
        widths = {"ACTIVITY_ID": 1, "ACT_NAME": 950, "ACT_STATUS": 150}
        anchors = {"ACTIVITY_ID": "center", "ACT_NAME": "w", "ACT_STATUS": "center"}

        for c in cols:
            self.view_tree_alist.heading(c, text=c, anchor=anchors[c])
            self.view_tree_alist.column( c, width=widths[c], minwidth=50, anchor=anchors[c])

        self.view_tree_alist.grid(row=1, column=0, columnspan=3, sticky="nsew")
        frame.grid_rowconfigure(1, weight=1)
        frame.grid_columnconfigure((0,1,2), weight=1)

    def _load_ActivityList_tab(self):
        user_id = self.view_user_alist.get().strip()
        if not user_id:
            messagebox.showwarning("Input error", "Please enter a user ID.")
            return
        try:
            df = bayes_db.get_ActivityList(user_id)
        except Exception as e:
            messagebox.showerror("Error", str(e))
            return
        for i in self.view_tree_alist.get_children():
            self.view_tree_alist.delete(i)
        for _, row in df.iterrows():
            self.view_tree_alist.insert("", "end", values=(
                row.ACTIVITY_ID, row.ACT_NAME, row.ACT_STATUS
            ))


    def _check_prior(self):
        """Run bayes_db.check_prior() and show its output."""
        buf = io.StringIO()
        old_stdout = sys.stdout
        try:
            sys.stdout = buf
            bayes_db.check_prior()
        finally:
            sys.stdout = old_stdout

        result = buf.getvalue().strip()
        messagebox.showinfo("Prior Check", result)

    def _build_update_tab(self, frame):
        # fetch activity IDs straight from the ACTIVITY table:
        # (you can pass "in_progress" if you only want those)
        self.activities = [str(i) for i in bayes_db.get_activity_ids(status="in_progress")]

        # Activity selector
        ttk.Label(frame, text="Activity ID:").grid(row=0, column=0, pady=5, sticky="e")
        self.act_cb = ttk.Combobox(frame, values=self.activities, state="readonly")
        self.act_cb.grid(row=0, column=1, pady=5, sticky="w")

        # Prior probability
        ttk.Label(frame, text="New Prior Prob:").grid(row=4, column=0, pady=5, sticky="e")
        self.prior_entry = ttk.Entry(frame)
        self.prior_entry.grid(row=4, column=1, pady=5, sticky="w")
        ttk.Button(frame, text="Update Prior", command=self._update_prior).grid(row=4, column=2, padx=10)

        # Posterior probability
        ttk.Label(frame, text="Posterior Type:").grid(row=2, column=0, pady=5, sticky="e")
        self.post_type = ttk.Combobox(
            frame,
            values=list(self.posterior_map.keys()),
            state="readonly"
        )
        self.post_type.grid(row=2, column=1, pady=5, sticky="w")
        ttk.Label(frame, text="New Value:").grid(row=3, column=0, pady=5, sticky="e")
        self.post_entry = ttk.Entry(frame)
        self.post_entry.grid(row=3, column=1, pady=5, sticky="w")
        ttk.Button(frame, text="Update Posterior", command=self._update_posterior).grid(row=3, column=2, padx=10)

        # Status update
        ALLOWED = sorted(bayes_db.ALLOWED_STATUSES) if hasattr(bayes_db, "ALLOWED_STATUSES") else [
            'not_started','in_progress','paused','completed','skipped','cancelled'
        ]
        ttk.Label(frame, text="New Status:").grid(row=1, column=0, pady=5, sticky="e")
        self.status_cb = ttk.Combobox(frame, values=ALLOWED, state="readonly")
        self.status_cb.grid(row=1, column=1, pady=5, sticky="w")
        ttk.Button(frame, text="Update Status", command=self._update_status).grid(row=1, column=2, padx=10)

        # Zero-out button
        ttk.Button(frame, text="Zero Out Others", command=self._zero_out).grid(
            row=5, column=1, pady=20, sticky="w"
        )
        
        # Check prior-sum button
        ttk.Button(frame, text="Check Prior Sum", command=self._check_prior).grid(
            row=6, column=1, pady=5, sticky="w"
        )

        for r in range(6):
            frame.grid_rowconfigure(r, pad=5)
        frame.grid_columnconfigure((0,1,2), weight=1)

    def _update_prior(self):
        aid = self.act_cb.get()
        try:
            p = float(self.prior_entry.get())
            bayes_db.update_prior_prob(aid, p)
            messagebox.showinfo("Success", f"Prior for '{aid}' set to {p}")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _update_posterior(self):
        aid = self.act_cb.get()
        choice = self.post_type.get()            # e.g. "Overview"
        try:
            col_choice = self.posterior_map[choice]  # → 2
            p = float(self.post_entry.get())
            bayes_db.update_posterior_prob(aid, col_choice, p)
            messagebox.showinfo("Success",
                f"Posterior #{col_choice} for '{aid}' set to {p}")
        except KeyError:
            messagebox.showwarning("Input error",
                "Please select a posterior type.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _update_status(self):
        aid = self.act_cb.get()
        status = self.status_cb.get()
        if not status:
            messagebox.showwarning("Input error", "Please select a status.")
            return
        try:
            bayes_db.update_status(aid, status)
            messagebox.showinfo("Success", f"Status for '{aid}' updated to '{status}'")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _zero_out(self):
        if messagebox.askyesno("Confirm", "Zero out all probs for non-in_progress activities?"):
            bayes_db.update_zero()
            messagebox.showinfo("Done", "All non-in_progress activities have been zeroed.")

    def _build_run_tab(self, frame):
        ttk.Label(frame, text="Total Minutes (optional):").grid(row=0, column=0, pady=5, sticky="e")
        self.minutes_entry = ttk.Entry(frame)
        self.minutes_entry.grid(row=0, column=1, pady=5, sticky="w")
        ttk.Button(frame, text="Run Bayes", command=self._run_bayes).grid(row=0, column=2, padx=10)

        cols = ["ACTIVITY_ID","ACT_NAME","Total","Learning","Overview","Practice"]
        self.run_tree = ttk.Treeview(frame, columns=cols, show="headings", height=20)
        for c in cols:
            self.run_tree.heading(c, text=c)
            self.run_tree.column(c, width=120, anchor="center")
        self.run_tree.grid(row=1, column=0, columnspan=3, sticky="nsew")
        frame.grid_rowconfigure(1, weight=1)
        frame.grid_columnconfigure((0,1,2), weight=1)

    def _run_bayes(self):
        mins = self.minutes_entry.get().strip()
        total = None
        if mins:
            try:
                total = float(mins)
            except ValueError:
                messagebox.showwarning("Input error", "Enter a numeric value for minutes.")
                return
        df = bayes_db.run_bayes(total)
        for i in self.run_tree.get_children():
            self.run_tree.delete(i)
        for _, row in df.iterrows():
            self.run_tree.insert("", "end", values=(
                row.ACTIVITY_ID, row.ACT_NAME,
                row.Total, row.Learning,
                row.Overview, row.Practice
            ))
    
    def on_table_change(self, event):
        for child in self.form_frame.winfo_children():
            child.destroy()
        self.widgets.clear()

        table_name = self.table_cb.get()
        self.table = Table(table_name, metadata, autoload_with=engine)

        for col in self.table.columns:
            if col.primary_key and col.autoincrement is True:
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

            elif isinstance(col.type, Date):
                date_ent = DateEntry(row, date_pattern='yyyy-MM-dd')
                date_ent.pack(side="left", fill="x", expand=True)

                today_btn = ttk.Button(
                    row, text="Today",
                    command=lambda d=date_ent: d.set_date(datetime.date.today())
                )
                today_btn.pack(side="left", padx=8)

                self.widgets[col.name] = date_ent
            
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
        if self.table is None:
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
    app = BayesApp()
    app.mainloop()