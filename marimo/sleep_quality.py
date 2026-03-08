import marimo

__generated_with = "0.20.4"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell(hide_code=True)
def _():
    import os
    import sqlalchemy

    _password = os.environ.get("MYSQL_PASSWORD", "banggenius0309")
    DATABASE_URL = f"mysql+pymysql://root:{_password}@localhost:3306/bancie"
    engine = sqlalchemy.create_engine(DATABASE_URL)
    return (engine,)


@app.cell
def _(engine, mo):
    df = mo.sql(
        f"""
        SELECT * FROM `SLEEP_LOG`
        """,
        engine=engine
    )
    return (df,)


@app.cell
def _(mo):
    mo.md(f"""
    # Thống kê mô tả cho bảng SLEEP_LOG
    """)
    return


@app.cell
def _(df):
    desc_stats = df.describe()
    desc_stats
    return (desc_stats,)


@app.cell
def _(df, mo):
    info_df = mo.vstack([
        mo.md("### Kiểu dữ liệu và giá trị null"),
        mo.ui.table(
            df.dtypes.reset_index().rename(columns={"index": "Cột", 0: "Kiểu dữ liệu"}).assign(**{"Số null": df.isnull().sum().values, "Tỷ lệ null (%)": (df.isnull().sum().values / len(df) * 100).round(2)})
        )
    ])
    info_df
    return


@app.cell
def _(df, mo):
    mo.ui.table(df)
    return


@app.cell
def _(desc_stats, mo):
    mo.ui.table(desc_stats)
    return


@app.cell
def _(engine, mo, sleep_log):
    # sleep_log removed: was in deps but never defined
    df2 = mo.sql(
        f"""
        SELECT
            *
        FROM
            SLEEP_LOG
        WHERE
        	SLEEP_TYPE like 'night'
        """,
        engine=engine
    )
    return (df2,)


@app.cell
def _():
    import pandas as pd
    import numpy as np
    import matplotlib.pyplot as plt
    import matplotlib.ticker as mticker

    return mticker, np, pd, plt


@app.cell
def _(df2, pd):
    # Chuẩn bị dữ liệu 30 ngày gần đây từ df2
    # _df_sleep = df2.copy()  # df2 from mo.sql() has no .copy(); use pandas below
    # _df_sleep = pd.DataFrame(df2).copy()  # caused KeyError if df2 columns not preserved
    if hasattr(df2, 'to_pandas'):
        _df_sleep = df2.to_pandas().copy()
    else:
        _df_sleep = pd.DataFrame(df2).copy()
    # Normalize column names (MySQL may return lowercase)
    _rename = {c: c.upper() for c in _df_sleep.columns if c.upper() in ('SLEEP_START', 'SLEEP_END') and c != c.upper()}
    if _rename:
        _df_sleep = _df_sleep.rename(columns=_rename)
    _df_sleep['SLEEP_START'] = pd.to_datetime(_df_sleep['SLEEP_START'])
    _df_sleep['SLEEP_END'] = pd.to_datetime(_df_sleep['SLEEP_END'])
    _df_sleep = _df_sleep.sort_values('SLEEP_START', ascending=False).head(30).sort_values('SLEEP_START').reset_index(drop=True)

    # Tính thời gian ngủ (giờ)
    _df_sleep['DURATION_HOURS'] = (_df_sleep['SLEEP_END'] - _df_sleep['SLEEP_START']).dt.total_seconds() / 3600

    # Quy giờ bắt đầu ngủ về trục liên tục (nếu < 12h sáng → cộng 24 để hiển thị liền mạch sau nửa đêm)
    def _to_continuous_hour(ts):
        h = ts.hour + ts.minute / 60
        return h + 24 if h < 12 else h

    _df_sleep['START_H'] = _df_sleep['SLEEP_START'].apply(_to_continuous_hour)
    _df_sleep['END_H'] = _df_sleep['SLEEP_END'].dt.hour + _df_sleep['SLEEP_END'].dt.minute / 60

    # Nhãn ngày
    _df_sleep['DATE_LBL'] = _df_sleep['SLEEP_START'].dt.strftime('%d/%m')

    sleep_30 = _df_sleep[['DATE_LBL', 'START_H', 'END_H', 'DURATION_HOURS']].copy()
    sleep_30
    return (sleep_30,)


@app.cell
def visualize(mticker, np, plt, sleep_30):
    # ── Helper format giờ:phút ──
    def _fmt_hm(h):
        hh = int(h) % 24
        mm = int(round((h % 1) * 60))
        return f"{hh}:{mm:02d}"

    # ── Tạo figure 3 subplots ──
    fig, axes = plt.subplots(3, 1, figsize=(18, 15), facecolor='#0f0f1a')
    x = np.arange(len(sleep_30))
    w = 0.55

    # ============================================================
    # 1) Giờ bắt đầu ngủ
    # ============================================================
    ax1 = axes[0]
    ax1.set_facecolor('#161625')
    _mean1 = sleep_30['START_H'].mean()
    _bars1 = ax1.bar(x, sleep_30['START_H'], w, color='#7c5cfc', edgecolor='#aaa', linewidth=.4, alpha=.88, zorder=3)
    _line1 = ax1.axhline(_mean1, color='#ff6b6b', ls='--', lw=2, zorder=4)
    # nhãn trên mỗi cột
    for b, v in zip(_bars1, sleep_30['START_H']):
        ax1.text(b.get_x() + w/2, b.get_height() + .08, _fmt_hm(v),
                 ha='center', va='bottom', fontsize=6.5, color='white', rotation=90)
    ax1.set_title('Giờ Bắt Đầu Ngủ – 30 đêm gần nhất', fontsize=15, fontweight='bold', color='white', pad=12)
    ax1.set_ylabel('Giờ', color='white', fontsize=11)
    # ax1.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: _fmt_hm(v)))  # OLD: y-axis ticks trigger RecursionError in draw() (Path deepcopy on Python 3.14)
    # text label instead of legend to avoid RecursionError (matplotlib Path deepcopy on Python 3.14)
    ax1.text(0.98, 0.96, f'TB: {_fmt_hm(_mean1)}', transform=ax1.transAxes, fontsize=10, color='#ff6b6b',
             va='top', ha='right', bbox=dict(boxstyle='round,pad=0.3', facecolor='#161625', edgecolor='#555'))

    # ============================================================
    # 2) Giờ thức dậy
    # ============================================================
    ax2 = axes[1]
    ax2.set_facecolor('#161625')
    _mean2 = sleep_30['END_H'].mean()
    _bars2 = ax2.bar(x, sleep_30['END_H'], w, color='#00cec9', edgecolor='#aaa', linewidth=.4, alpha=.88, zorder=3)
    _line2 = ax2.axhline(_mean2, color='#ff6b6b', ls='--', lw=2, zorder=4)
    for b, v in zip(_bars2, sleep_30['END_H']):
        ax2.text(b.get_x() + w/2, b.get_height() + .08, _fmt_hm(v),
                 ha='center', va='bottom', fontsize=6.5, color='white', rotation=90)
    ax2.set_title('Giờ Thức Dậy – 30 đêm gần nhất', fontsize=15, fontweight='bold', color='white', pad=12)
    ax2.set_ylabel('Giờ', color='white', fontsize=11)
    # ax2.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: _fmt_hm(v)))  # OLD: y-axis ticks trigger RecursionError in draw()
    ax2.text(0.98, 0.96, f'TB: {_fmt_hm(_mean2)}', transform=ax2.transAxes, fontsize=10, color='#ff6b6b',
             va='top', ha='right', bbox=dict(boxstyle='round,pad=0.3', facecolor='#161625', edgecolor='#555'))

    # ============================================================
    # 3) Thời lượng ngủ (tô màu theo ngưỡng)
    # ============================================================
    ax3 = axes[2]
    ax3.set_facecolor('#161625')
    _mean3 = sleep_30['DURATION_HOURS'].mean()
    _dur_colors = ['#e74c3c' if d < 6 else '#f39c12' if d < 7 else '#2ecc71' for d in sleep_30['DURATION_HOURS']]
    _bars3 = ax3.bar(x, sleep_30['DURATION_HOURS'], w, color=_dur_colors, edgecolor='#aaa', linewidth=.4, alpha=.88, zorder=3)
    _line3a = ax3.axhline(_mean3, color='#ff6b6b', ls='--', lw=2, zorder=4)
    _line3b = ax3.axhline(7, color='#2ecc71', ls=':', lw=1.5, alpha=.6, zorder=4)
    for b, v in zip(_bars3, sleep_30['DURATION_HOURS']):
        ax3.text(b.get_x() + w/2, b.get_height() + .08, f'{v:.1f}h',
                 ha='center', va='bottom', fontsize=6.5, color='white', rotation=90)
    ax3.set_title('😴  Thời Lượng Giấc Ngủ – 30 đêm gần nhất', fontsize=15, fontweight='bold', color='white', pad=12)
    ax3.set_ylabel('Giờ', color='white', fontsize=11)
    ax3.set_xlabel('Ngày', color='white', fontsize=11)
    ax3.text(0.98, 0.96, f'TB: {_mean3:.1f}h', transform=ax3.transAxes, fontsize=10, color='#ff6b6b',
             va='top', ha='right', bbox=dict(boxstyle='round,pad=0.3', facecolor='#161625', edgecolor='#555'))
    ax3.text(0.98, 0.82, 'Mục tiêu 7h', transform=ax3.transAxes, fontsize=10, color='#2ecc71',
             va='top', ha='right', bbox=dict(boxstyle='round,pad=0.3', facecolor='#161625', edgecolor='#555'))

    # ── Chung cho cả 3 ──
    # Avoid any axis tick creation: on Python 3.14 matplotlib's tick copy triggers Path.__deepcopy__
    # RecursionError (during draw/savefig via yaxis.get_tightbbox -> _update_ticks). So disable both
    # x and y ticks and draw labels + grid manually.
    _n = len(sleep_30)
    _date_lbl = list(sleep_30['DATE_LBL'])
    _step = max(1, (_n + 6) // 8)  # show ~8 date labels
    _tick_positions = list(range(0, _n, _step))
    if _n > 1 and (_tick_positions[-1] != _n - 1):
        _tick_positions.append(_n - 1)

    def _y_ticks_and_fmt(ax, fmt_hm=False):
        """Compute 5 y tick values from ax ylim; return (tick_values, label_strs)."""
        ymin, ymax = ax.get_ylim()
        ticks = np.linspace(ymin, ymax, 5)
        if fmt_hm:
            labels = [_fmt_hm(t) for t in ticks]
        else:
            labels = [f'{t:.1f}h' for t in ticks]
        return ticks, labels

    for idx, ax in enumerate(axes):
        ax.set_xlim(-0.5, _n - 0.5)
        # X-axis: no ticks, draw date labels manually
        ax.xaxis.set_major_locator(mticker.FixedLocator([]))
        ax.xaxis.set_major_formatter(mticker.NullFormatter())
        for i in _tick_positions:
            if i < len(_date_lbl):
                _xax = (i + 0.5) / _n
                ax.text(_xax, -0.06, _date_lbl[i], transform=ax.transAxes,
                        ha='center', va='top', fontsize=7.5, color='white', rotation=45)
        # Y-axis: no ticks so draw() never calls _update_ticks (avoids Path deepcopy RecursionError).
        # Draw grid lines and y labels manually.
        use_hm = (idx != 2)  # ax1, ax2 = time; ax3 = duration hours
        _yt, _ylbl = _y_ticks_and_fmt(ax, fmt_hm=use_hm)
        ax.yaxis.set_major_locator(mticker.FixedLocator([]))
        ax.yaxis.set_major_formatter(mticker.NullFormatter())
        _xlim = ax.get_xlim()
        _left_x = _xlim[0] - (_xlim[1] - _xlim[0]) * 0.04
        for _tv, _lb in zip(_yt, _ylbl):
            ax.axhline(_tv, alpha=0.12, color='white', zorder=1, lw=0.5)
            ax.text(_left_x, _tv, _lb, transform=ax.transData, fontsize=8, color='white',
                    ha='right', va='center')
        ax.tick_params(colors='white')
        # ax.grid(axis='y', ...)  # OLD: would use axis ticks; we drew grid with axhline above
        for spine in ['top', 'right']:
            ax.spines[spine].set_visible(False)
        for spine in ['left', 'bottom']:
            ax.spines[spine].set_color('#444')

    # plt.tight_layout(h_pad=3)  # OLD: triggers get_tightbbox -> _update_ticks -> RecursionError (Path deepcopy on Python 3.14)
    # NEW: use subplots_adjust so layout never calls _update_ticks
    fig.subplots_adjust(left=0.06, right=0.98, top=0.96, bottom=0.10, hspace=0.35)
    # Return image instead of fig/axes to avoid RecursionError in deepcopy (matplotlib Path)
    import io
    buf = io.BytesIO()
    # fig.savefig(buf, format='png', bbox_inches='tight', facecolor='#0f0f1a')  # OLD: bbox_inches='tight' can trigger same tightbbox path
    fig.savefig(buf, format='png', facecolor='#0f0f1a')  # NEW: use figure bbox from subplots_adjust only
    buf.seek(0)
    plt.close(fig)
    # Pass bytes (not BytesIO) so marimo can display the image
    return (buf,)


@app.cell
def _(buf, mo, sleep_30):
    # Tạo ảnh từ buffer
    _plot_image = mo.image(buf.getvalue())

    # Tạo bảng thống kê markdown
    _summary = mo.md(f"""
    ## 📋 Tổng hợp thống kê giấc ngủ – 30 đêm gần nhất

    | Chỉ số | Trung bình | Sớm nhất / Thấp nhất | Muộn nhất / Cao nhất | Độ lệch chuẩn |
    |:-------|:----------:|:---------------------:|:---------------------:|:--------------:|
    | **Giờ bắt đầu ngủ** | {int(sleep_30['START_H'].mean())%24}:{int(round((sleep_30['START_H'].mean()%1)*60)):02d} | {int(sleep_30['START_H'].min())%24}:{int(round((sleep_30['START_H'].min()%1)*60)):02d} | {int(sleep_30['START_H'].max())%24}:{int(round((sleep_30['START_H'].max()%1)*60)):02d} | {sleep_30['START_H'].std():.2f}h |
    | **Giờ thức dậy** | {int(sleep_30['END_H'].mean())}:{int(round((sleep_30['END_H'].mean()%1)*60)):02d} | {int(sleep_30['END_H'].min())}:{int(round((sleep_30['END_H'].min()%1)*60)):02d} | {int(sleep_30['END_H'].max())}:{int(round((sleep_30['END_H'].max()%1)*60)):02d} | {sleep_30['END_H'].std():.2f}h |
    | **Thời lượng ngủ** | {sleep_30['DURATION_HOURS'].mean():.1f}h | {sleep_30['DURATION_HOURS'].min():.1f}h | {sleep_30['DURATION_HOURS'].max():.1f}h | {sleep_30['DURATION_HOURS'].std():.2f}h |

    ### Chú thích màu thời lượng ngủ
    - 🟢 **Xanh lá** — ≥ 7 giờ (đủ giấc): **{(sleep_30['DURATION_HOURS'] >= 7).sum()}** đêm ({(sleep_30['DURATION_HOURS'] >= 7).mean()*100:.0f}%)
    - 🟡 **Vàng** — 6 – 7 giờ: **{((sleep_30['DURATION_HOURS'] >= 6) & (sleep_30['DURATION_HOURS'] < 7)).sum()}** đêm
    - 🔴 **Đỏ** — < 6 giờ (thiếu ngủ): **{(sleep_30['DURATION_HOURS'] < 6).sum()}** đêm
    """)

    # Hiển thị cả plot và bảng thống kê
    mo.vstack([_plot_image, _summary])
    return


if __name__ == "__main__":
    app.run()
