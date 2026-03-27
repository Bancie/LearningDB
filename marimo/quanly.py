import marimo

__generated_with = "0.21.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import altair as alt

    return alt, mo


@app.cell(hide_code=True)
def _():
    import os
    import sqlalchemy
    from dotenv import load_dotenv
    load_dotenv()

    _password = os.environ.get("MYSQL_PASSWORD")

    DATABASE_URL = f"mysql+pymysql://root:{_password}@localhost:3306/bancie"
    engine = sqlalchemy.create_engine(DATABASE_URL, connect_args={'ssl': {'ssl-mode': 'preferred'}})
    return (engine,)


@app.cell
def _(engine, ml_reading, mo):
    mlreading = mo.sql(
        f"""
        SELECT * FROM ml_reading
        """,
        output=False,
        engine=engine
    )
    return (mlreading,)


@app.cell
def _(alt, mlreading, mo):
    chart = mo.ui.altair_chart((
        alt.Chart(mlreading)
        .mark_point()
        .encode(
            x=alt.X(field='minutes', type='quantitative', title='Minutes'),
            y=alt.Y(field='TOTAL_COUNT', type='quantitative', title='Pages', aggregate='mean'),
            color=alt.Color(field='FOCUS_LEVEL', type='nominal'),
            tooltip=[
                alt.Tooltip(field='minutes', format=',.0f', title='Minutes'),
                alt.Tooltip(field='TOTAL_COUNT', aggregate='mean', format=',.2f', title='Pages'),
                alt.Tooltip(field='FOCUS_LEVEL')
            ]
        )
        .properties(
            title='Focus on reading performance',
            height=341,
            width=455,
            config={
                'axis': {
                    'grid': True
                }
            }
        )
    ))
    return (chart,)


@app.cell
def _(chart, mo):
    mo.vstack([chart, mo.ui.table(chart.value)])
    return


@app.cell
def _(activity, activity_log, activity_output, engine, kit_count, mo):
    periodreading = mo.sql(
        f"""
        SELECT
            *,
            DATE(ACTLOG_START) AS ACTLOG_DATE,
            CASE
                WHEN EXTRACT(HOUR FROM ACTLOG_START) < 12 THEN 'Morning'
                WHEN EXTRACT(HOUR FROM ACTLOG_START) < 17 THEN 'Afternoon'
                ELSE 'Evening'
            END AS ACTLOG_START_CATE,
            TIMESTAMPDIFF(MINUTE, ACTLOG_START, AO_FINISH) - BREAK_TIME AS minutes_overall
        FROM
            KIT_COUNT
            natural join ACTIVITY_OUTPUT
        	natural join ACTIVITY_LOG
        	natural join ACTIVITY
        WHERE UNIT_COUNT like 'words'
        """,
        engine=engine
    )
    return (periodreading,)


@app.cell
def _(alt, mo, periodreading):
    # replace _df with your data source
    chartwordonmin = mo.ui.altair_chart((
        alt.Chart(periodreading)
        .mark_point()
        .encode(
            x=alt.X(field='ACTLOG_START', type='temporal', title='Times', timeUnit='yearmonthdate'),
            y=alt.Y(field='minutes_overall', type='quantitative', title='Minutes'),
            color=alt.Color(field='TOTAL_COUNT', type='quantitative', scale={
                'scheme': 'oranges'
            }, bin={
                'step': 5000
            }),
            tooltip=[
                alt.Tooltip(field='ACTLOG_START', timeUnit='yearmonthdate', title='Times'),
                alt.Tooltip(field='minutes_overall', format=',.0f', title='Minutes'),
                alt.Tooltip(field='TOTAL_COUNT', format=',.2f', bin={
                    'step': 5000
                })
            ]
        )
        .properties(
            title='Word on minute reading at time',
            height=246,
            width=800,
            config={
                'axis': {
                    'grid': True
                }
            }
        )
    ))
    return (chartwordonmin,)


@app.cell
def _(alt, mo, periodreading):
    # replace _df with your data source
    chart_periodreading = mo.ui.altair_chart((
        alt.Chart(periodreading)
        .mark_point()
        .encode(
            x=alt.X('ACTLOG_DATE:T', title='Time'),
            y=alt.Y(field='TOTAL_COUNT', type='quantitative', title='Words', aggregate='mean'),
            color=alt.Color(field='ACTLOG_START_CATE', type='nominal', scale={
                'scheme': 'set2'
            }),
            tooltip=[
                alt.Tooltip(field='ACTLOG_START', timeUnit='yearmonthdate', title='Time'),
                alt.Tooltip(field='TOTAL_COUNT', aggregate='mean', format=',.2f', title='Words'),
                alt.Tooltip(field='ACTLOG_START_CATE')
            ]
        )
        .properties(
            title='Period of Reading',
            height=321,
            width=421,
            config={
                'axis': {
                    'grid': True
                }
            }
        )
    ))
    return (chart_periodreading,)


@app.cell
def _(chart_periodreading, mo):
    mo.vstack([chart_periodreading, mo.ui.table(chart_periodreading.value)])
    return


@app.cell
def _(chartwordonmin, mo):
    mo.vstack([chartwordonmin, mo.ui.table(chartwordonmin.value)])
    return


if __name__ == "__main__":
    app.run()
