import marimo

__generated_with = "0.20.1"
app = marimo.App()


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _():
    # '%pip install -r ../requirements.txt' command supported automatically in marimo
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Set up database
    """)
    return


@app.cell
def _():
    from dotenv import load_dotenv
    import os

    load_dotenv()

    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASS")
    host = os.getenv("DB_HOST")
    dbname = os.getenv("DB_NAME")

    from sqlalchemy import create_engine
    engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}", connect_args={'init_command': 'SET time_zone="+07:00"'})
    return (engine,)


@app.cell
def _():
    import pandas as pd
    import matplotlib.pyplot as plt
    from matplotlib.gridspec import GridSpec
    from matplotlib.table import Table

    return GridSpec, pd, plt


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Reading (all)
    """)
    return


@app.cell
def _(engine, pd):
    _query = 'SELECT * FROM `ml_reading`'
    ps = pd.read_sql(_query, engine)
    ps.head()
    return (ps,)


@app.cell
def _(GridSpec, plt, ps):
    _fig = plt.figure(figsize=(12, 8))
    _gs = GridSpec(3, 2, figure=_fig)
    _desc = ps[['TOTAL_COUNT', 'minutes', 'BREAK_TIME']].describe().round(2)
    _ax_table = _fig.add_subplot(_gs[0, 1])
    _ax_table.axis('off')
    _table = _ax_table.table(cellText=_desc.values, rowLabels=_desc.index, colLabels=_desc.columns, loc='center')
    _table.auto_set_font_size(False)
    _table.set_fontsize(8)
    _table.scale(1, 1)
    for _key, _cell in _table.get_celld().items():
        _cell.set_text_props(ha='center', va='center')
    _ax_table.set_title('Descriptive Statistics', fontsize=10)
    _ax1 = _fig.add_subplot(_gs[0, 0])
    _ax1.hist(ps['TOTAL_COUNT'])
    _ax1.set_xlabel('pages')
    _ax1.set_title('Total page')
    _ax2 = _fig.add_subplot(_gs[1, 0])
    _ax2.hist(ps['minutes'])
    _ax2.set_xlabel('minutes')
    _ax2.set_title('Minutes')
    # --- Plot 1 ---
    _ax3 = _fig.add_subplot(_gs[2, 0])
    _ax3.hist(ps['BREAK_TIME'])
    _ax3.set_xlabel('break time')
    _ax3.set_title('Break time')
    _ax4 = _fig.add_subplot(_gs[1:, 1])
    # --- Plot 2 ---
    _ax4.boxplot([ps['minutes'].dropna(), ps['BREAK_TIME'].dropna()], labels=['minutes', 'BREAK_TIME'])
    _ax4.set_title('Boxplot of reading time')
    _ax4.set_ylabel('Minute')
    plt.tight_layout()
    # --- Plot 3 ---
    # --- Boxplot ---
    plt.show()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Technical and Vocational books
    """)
    return


@app.cell
def _(engine, pd):
    _query = "SELECT * FROM `ml_reading` WHERE `ACTIVITY_CATEGORY` like 'technical_&_vocational'"
    ps_1 = pd.read_sql(_query, engine)
    ps_1.head()
    return (ps_1,)


@app.cell
def _(GridSpec, plt, ps_1):
    _fig = plt.figure(figsize=(12, 8))
    _gs = GridSpec(3, 2, figure=_fig)
    _desc = ps_1[['TOTAL_COUNT', 'minutes', 'BREAK_TIME']].describe().round(2)
    _ax_table = _fig.add_subplot(_gs[0, 1])
    _ax_table.axis('off')
    _table = _ax_table.table(cellText=_desc.values, rowLabels=_desc.index, colLabels=_desc.columns, loc='center')
    _table.auto_set_font_size(False)
    _table.set_fontsize(8)
    _table.scale(1, 1)
    for _key, _cell in _table.get_celld().items():
        _cell.set_text_props(ha='center', va='center')
    _ax_table.set_title('Descriptive Statistics', fontsize=10)
    _ax1 = _fig.add_subplot(_gs[0, 0])
    _ax1.hist(ps_1['TOTAL_COUNT'])
    _ax1.set_xlabel('pages')
    _ax1.set_title('Total page')
    _ax2 = _fig.add_subplot(_gs[1, 0])
    _ax2.hist(ps_1['minutes'])
    _ax2.set_xlabel('minutes')
    _ax2.set_title('Minutes')
    _ax3 = _fig.add_subplot(_gs[2, 0])
    _ax3.hist(ps_1['BREAK_TIME'])
    _ax3.set_xlabel('break time')
    _ax3.set_title('Break time')
    _ax4 = _fig.add_subplot(_gs[1:, 1])
    _ax4.boxplot([ps_1['minutes'].dropna(), ps_1['BREAK_TIME'].dropna()], labels=['minutes', 'BREAK_TIME'])
    _ax4.set_title('Boxplot of reading time')
    _ax4.set_ylabel('Minute')
    plt.tight_layout()
    plt.show()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Device: Laptop
    """)
    return


@app.cell
def _(engine, pd):
    _query = "SELECT * FROM `ml_reading` \n            WHERE\n            `ACTIVITY_CATEGORY` like 'technical_&_vocational'\n            AND\n            `DEVICE` like 'laptop'\n        "
    ps_2 = pd.read_sql(_query, engine)
    ps_2.head()
    return (ps_2,)


@app.cell
def _(GridSpec, plt, ps_2):
    _fig = plt.figure(figsize=(12, 8))
    _gs = GridSpec(3, 2, figure=_fig)
    _desc = ps_2[['TOTAL_COUNT', 'minutes', 'BREAK_TIME']].describe().round(2)
    _ax_table = _fig.add_subplot(_gs[0, 1])
    _ax_table.axis('off')
    _table = _ax_table.table(cellText=_desc.values, rowLabels=_desc.index, colLabels=_desc.columns, loc='center')
    _table.auto_set_font_size(False)
    _table.set_fontsize(8)
    _table.scale(1, 1)
    for _key, _cell in _table.get_celld().items():
        _cell.set_text_props(ha='center', va='center')
    _ax_table.set_title('Descriptive Statistics', fontsize=10)
    _ax1 = _fig.add_subplot(_gs[0, 0])
    _ax1.hist(ps_2['TOTAL_COUNT'])
    _ax1.set_xlabel('pages')
    _ax1.set_title('Total page')
    _ax2 = _fig.add_subplot(_gs[1, 0])
    _ax2.hist(ps_2['minutes'])
    _ax2.set_xlabel('minutes')
    _ax2.set_title('Minutes')
    _ax3 = _fig.add_subplot(_gs[2, 0])
    _ax3.hist(ps_2['BREAK_TIME'])
    _ax3.set_xlabel('break time')
    _ax3.set_title('Break time')
    _ax4 = _fig.add_subplot(_gs[1:, 1])
    _ax4.boxplot([ps_2['minutes'].dropna(), ps_2['BREAK_TIME'].dropna()], labels=['minutes', 'BREAK_TIME'])
    _ax4.set_title('Boxplot of reading time')
    _ax4.set_ylabel('Minute')
    _fig.suptitle('Reading Behavior Summary: Technical and Vocational books (Device: Macbook)', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.show()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Academic books
    """)
    return


@app.cell
def _(engine, pd):
    _query = "SELECT * FROM `ml_reading` WHERE `ACTIVITY_CATEGORY` like 'academic'"
    ps_3 = pd.read_sql(_query, engine)
    ps_3.head()
    return (ps_3,)


@app.cell
def _(GridSpec, plt, ps_3):
    _fig = plt.figure(figsize=(12, 8))
    _gs = GridSpec(3, 2, figure=_fig)
    _desc = ps_3[['TOTAL_COUNT', 'minutes', 'BREAK_TIME']].describe().round(2)
    _ax_table = _fig.add_subplot(_gs[0, 1])
    _ax_table.axis('off')
    _table = _ax_table.table(cellText=_desc.values, rowLabels=_desc.index, colLabels=_desc.columns, loc='center')
    _table.auto_set_font_size(False)
    _table.set_fontsize(8)
    _table.scale(1, 1)
    for _key, _cell in _table.get_celld().items():
        _cell.set_text_props(ha='center', va='center')
    _ax_table.set_title('Descriptive Statistics', fontsize=10)
    _ax1 = _fig.add_subplot(_gs[0, 0])
    _ax1.hist(ps_3['TOTAL_COUNT'])
    _ax1.set_xlabel('pages')
    _ax1.set_title('Total page')
    _ax2 = _fig.add_subplot(_gs[1, 0])
    _ax2.hist(ps_3['minutes'])
    _ax2.set_xlabel('minutes')
    _ax2.set_title('Minutes')
    _ax3 = _fig.add_subplot(_gs[2, 0])
    _ax3.hist(ps_3['BREAK_TIME'])
    _ax3.set_xlabel('break time')
    _ax3.set_title('Break time')
    _ax4 = _fig.add_subplot(_gs[1:, 1])
    _ax4.boxplot([ps_3['minutes'].dropna(), ps_3['BREAK_TIME'].dropna()], labels=['minutes', 'BREAK_TIME'])
    _ax4.set_title('Boxplot of reading time')
    _ax4.set_ylabel('Minute')
    plt.tight_layout()
    plt.show()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Device: Laptop
    """)
    return


@app.cell
def _(engine, pd):
    _query = "SELECT * FROM `ml_reading` WHERE `ACTIVITY_CATEGORY` like 'academic' and `DEVICE` like 'laptop'"
    ps_4 = pd.read_sql(_query, engine)
    ps_4.head()
    return (ps_4,)


@app.cell
def _(GridSpec, plt, ps_4):
    _fig = plt.figure(figsize=(12, 8))
    _gs = GridSpec(3, 2, figure=_fig)
    _desc = ps_4[['TOTAL_COUNT', 'minutes', 'BREAK_TIME']].describe().round(2)
    _ax_table = _fig.add_subplot(_gs[0, 1])
    _ax_table.axis('off')
    _table = _ax_table.table(cellText=_desc.values, rowLabels=_desc.index, colLabels=_desc.columns, loc='center')
    _table.auto_set_font_size(False)
    _table.set_fontsize(8)
    _table.scale(1, 1)
    for _key, _cell in _table.get_celld().items():
        _cell.set_text_props(ha='center', va='center')
    _ax_table.set_title('Descriptive Statistics', fontsize=10)
    _ax1 = _fig.add_subplot(_gs[0, 0])
    _ax1.hist(ps_4['TOTAL_COUNT'])
    _ax1.set_xlabel('pages')
    _ax1.set_title('Total page')
    _ax2 = _fig.add_subplot(_gs[1, 0])
    _ax2.hist(ps_4['minutes'])
    _ax2.set_xlabel('minutes')
    _ax2.set_title('Minutes')
    _ax3 = _fig.add_subplot(_gs[2, 0])
    _ax3.hist(ps_4['BREAK_TIME'])
    _ax3.set_xlabel('break time')
    _ax3.set_title('Break time')
    _ax4 = _fig.add_subplot(_gs[1:, 1])
    _ax4.boxplot([ps_4['minutes'].dropna(), ps_4['BREAK_TIME'].dropna()], labels=['minutes', 'BREAK_TIME'])
    _ax4.set_title('Boxplot of reading time')
    _ax4.set_ylabel('Minute')
    _fig.suptitle('Reading Behavior Summary: Academic books (Device: Macbook)', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.show()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Marimo test
    """)
    return


@app.cell
def _(mo):
    min = mo.ui.slider(1,60)
    min
    return (min,)


@app.cell
def _(min, mo):
    mo.md(f"""
    Minute = {min.value}
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    name = mo.ui.text(placeholder="Your name here")
    mo.md(
      f"""
      Hi! What's your name?

      {name}
      """
    )
    return (name,)


@app.cell
def _(mo, name):
    mo.md(f"""
    Hello, {name.value}!
    """)
    return


@app.cell(hide_code=True)
def _(mo, name):
    mo.md(f"""
    Hello Bro **{name.value}**
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    /// details | Heads up

    Here's some additional context.
    ///
    """)
    return


@app.cell
def _(mo):
    mo.sidebar(
        [
            mo.md("# marimo"),
            mo.nav_menu(
                {
                    "#home": f"{mo.icon('lucide:home')} Home",
                    "#about": f"{mo.icon('lucide:user')} About",
                    "#contact": f"{mo.icon('lucide:phone')} Contact",
                    "Links": {
                        "https://twitter.com/marimo_io": "Twitter",
                        "https://github.com/marimo-team/marimo": "GitHub",
                    },
                },
                orientation="vertical",
            ),
        ]
    )
    return


@app.cell
def _(mo):
    # mo.status.progress_bar is similar to TQDM
    for i in mo.status.progress_bar(range(10)):
      print(i)
    return


@app.cell
def _(expensive_function, mo):
    with mo.status.spinner(subtitle="Loading data ...") as _spinner:
        data = expensive_function()
        _spinner.update(subtitle="Crunching numbers ...")
        ...

    mo.ui.table(data)
    return


if __name__ == "__main__":
    app.run()
