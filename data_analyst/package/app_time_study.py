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

load_dotenv()  # loads DB_USER, DB_PASS, etc.

class BayesApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Bayesian Activity Scheduler")
        self.geometry("900x620")

        # map human-readable labels → posterior column IDs
        self.posterior_map = {
            "Learning":  1,
            "Overview":  2,
            "Practice":  3,
        }

        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=True)


        # --- Tab 1: Update Probabilities & Status ---
        upd_frame = ttk.Frame(notebook)
        notebook.add(upd_frame, text="Update Data")
        self._build_update_tab(upd_frame)
        
        # --- Tab 2: View Activities ---
        view_frame = ttk.Frame(notebook)
        notebook.add(view_frame, text="View Activities")
        self._build_view_tab(view_frame)

        # --- Tab 3: Run Bayes ---
        run_frame = ttk.Frame(notebook)
        notebook.add(run_frame, text="Run Bayes")
        self._build_run_tab(run_frame)

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
        ttk.Label(frame, text="New Prior Prob:").grid(row=1, column=0, pady=5, sticky="e")
        self.prior_entry = ttk.Entry(frame)
        self.prior_entry.grid(row=1, column=1, pady=5, sticky="w")
        ttk.Button(frame, text="Update Prior", command=self._update_prior).grid(row=1, column=2, padx=10)

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
        ttk.Label(frame, text="New Status:").grid(row=4, column=0, pady=5, sticky="e")
        self.status_cb = ttk.Combobox(frame, values=ALLOWED, state="readonly")
        self.status_cb.grid(row=4, column=1, pady=5, sticky="w")
        ttk.Button(frame, text="Update Status", command=self._update_status).grid(row=4, column=2, padx=10)

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

if __name__ == "__main__":
    app = BayesApp()
    app.mainloop()