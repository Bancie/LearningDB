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
    from IPython.display import display

    load_dotenv()

    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASS")
    host = os.getenv("DB_HOST")
    dbname = os.getenv("DB_NAME")

    from sqlalchemy import create_engine
    engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}", connect_args={'init_command': 'SET time_zone="+07:00"'})
    return display, engine


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Sleep
    """)
    return


@app.cell
def _():
    import pandas as pd
    import matplotlib.pyplot as plt

    return pd, plt


@app.cell
def _(display, engine, pd, plt):
    query = "SELECT * FROM ML_FOR_SLEEP"
    df = pd.read_sql(query, engine)

    combo_counts = df.groupby(
        [
            "SLEEP_START_CATEGORY",
            "SLEEP_END_CATEGORY",
            "WAKE_FEELING_CATEGORY",
            "MINUTES_PER_DAY_CATEGORY"
        ]
    ).size().reset_index(name="count")

    display(combo_counts)

    combo_counts["label"] = combo_counts.index.astype(str)

    plt.figure(figsize=(12, 6))
    plt.bar(combo_counts["label"], combo_counts["count"])
    plt.xlabel("Combination Index")
    plt.ylabel("Count")
    plt.title("Distribution of Sleep Category Combinations")
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.show()
    return (df,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Sklearn
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    setting up
    """)
    return


@app.cell
def _(df):
    from sklearn.preprocessing import LabelEncoder
    from sklearn.tree import DecisionTreeClassifier, plot_tree
    label_encoders = {}
    for _col in ['SLEEP_START_CATEGORY', 'SLEEP_END_CATEGORY', 'WAKE_FEELING_CATEGORY', 'MINUTES_PER_DAY_CATEGORY']:
        le = LabelEncoder()
        df[_col] = le.fit_transform(df[_col])
        label_encoders[_col] = le
    X = df[['SLEEP_START_CATEGORY', 'SLEEP_END_CATEGORY', 'WAKE_FEELING_CATEGORY']]
    y = df['MINUTES_PER_DAY_CATEGORY']
    clf = DecisionTreeClassifier(criterion='entropy', max_depth=None, random_state=42)
    clf.fit(X, y)
    return X, clf, label_encoders, plot_tree


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Decision tree
    """)
    return


@app.cell
def _(X, clf, label_encoders, plot_tree, plt):
    plt.figure(figsize=(10, 6))
    plot_tree(
        clf,
        feature_names=X.columns,
        class_names=label_encoders["MINUTES_PER_DAY_CATEGORY"].classes_,
        filled=True,
        rounded=True
    )
    plt.title("Decision Tree: Predicting MINUTES_PER_DAY_CATEGORY")
    plt.show()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Predict from new data
    """)
    return


@app.cell
def _(X, clf, label_encoders, pd):
    sample = pd.DataFrame([['Late', 'Late', 'Good']], columns=X.columns)
    for _col in sample.columns:
        sample[_col] = label_encoders[_col].transform(sample[_col])
    pred = clf.predict(sample)
    print(label_encoders['MINUTES_PER_DAY_CATEGORY'].inverse_transform(pred)[0])
    return


app._unparsable_cell(
    r"""
    from ../data_analyst/package import ml
    """,
    name="_"
)


@app.cell
def _(ml):
    ml.sleep_via_study("Late", "Late", "Good")
    return


if __name__ == "__main__":
    app.run()
