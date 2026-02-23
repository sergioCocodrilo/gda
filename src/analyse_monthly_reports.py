import pandas as pd
import os
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.graph_objects as go


def read_data_file(file_path, file_name):
    date_part = file_name.split('_Q')[-1].split('.')[0]
    year = "20" + date_part[:2]
    month = date_part[2:]
    df = pd.read_excel(file_path, sheet_name="Datos")
    df['year'] = year
    df['month'] = month
    return df


def read_files_in_dir(directory):
    all_dfs = []
    for filename in os.listdir(directory):
        if filename.endswith(".xlsx") and "_Q" in filename:
            all_dfs.append(read_data_file(os.path.join(directory, filename), filename))
    return pd.concat(all_dfs, ignore_index=True) if all_dfs else pd.DataFrame()


def process_data(df, cols_to_analyze, id_cols):
    rename_dict = {
        'CDMXDFASDS1': 'Abastos', 'CDMXDFERDS1': 'ER', 
        'CDMXDFES23T': 'ES_LD', 'CDMXDFESDS2': 'ES', 'CDMXDFMYDS3': 'MY'
    }
    if 'CLLI_REAL' in df.columns:
        df['CLLI_REAL'] = df['CLLI_REAL'].replace(rename_dict)

    # 1. Monthly Totals
    monthly_ids = list(set(id_cols + ['month', 'year']))
    df_monthly = df.groupby(monthly_ids)[cols_to_analyze].sum().reset_index()
    for col in cols_to_analyze:
        m_totals = df_monthly.groupby(['year', 'month'])[col].transform('sum')
        df_monthly[f'{col}_percentage'] = (df_monthly[col] / m_totals) * 100

    # 2. Annual Totals
    annual_ids = [c for c in id_cols if c not in ['month']]
    df_annual = df.groupby(annual_ids)[cols_to_analyze].sum().reset_index()
    for col in cols_to_analyze:
        total_sum = df_annual[col].sum()
        df_annual[f'{col}_percentage'] = (df_annual[col] / total_sum) * 100 if total_sum != 0 else 0

    return df_monthly, df_annual

def plot_interactive_data(df, columns_to_plot, file_path):
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=("Escala lineal", "Escala logarítmica (permite ver valores pequeños)"),
        vertical_spacing=0.12
    )

    months = sorted(df['month'].unique())

    # Add traces for all columns, but only make the first set visible
    for i, col in enumerate(columns_to_plot):
        for m in months:
            month_df = df[df['month'] == m]
            visible = True if i == 0 else False
            # Linear Trace
            fig.add_trace(
                go.Bar(x=month_df['EDIFICIO'], y=month_df[col], name=f"{m}",
                       hovertext=month_df['CLLI_REAL'], visible=visible),
                row=1, col=1
            )
            # Log Trace
            fig.add_trace(
                go.Bar(x=month_df['EDIFICIO'], y=month_df[col], name=f"{m}",
                       showlegend=False, hovertext=month_df['CLLI_REAL'], visible=visible),
                row=2, col=1
            )

    # Create the dropdown menu
    buttons = []
    for i, col in enumerate(columns_to_plot):
        visibility = [False] * (len(columns_to_plot) * len(months) * 2)
        for j in range(len(months) * 2):
            visibility[i * len(months) * 2 + j] = True
        
        buttons.append(dict(
            label=col,
            method="update",
            args=[{"visible": visibility}]
        ))

    fig.update_layout(
        updatemenus=[dict(
            active=0,
            buttons=buttons,
            direction="down",
            pad={"r": 10, "t": 10},
            showactive=True,
            x=0.1,
            xanchor="left",
            y=1.1,
            yanchor="top"
        )]
    )

    # Formatting
    fig.update_yaxes(type="log", row=2, col=1)
    fig.update_layout(
        height=900,
        title_text="Análisis de incidencias (eje Y) por central (eje X) y meses",
        barmode='group',
        legend_title="Meses"
    )
    fig.write_html(file_path)


def filter_maintenance_data(df, centers=None, buildings=None):
    filtered_df = df.copy()

    # Filter by Maintenance Center if provided
    if centers:
        if isinstance(centers, list):
            filtered_df = filtered_df[filtered_df['CENTRO DE MANTENIMIENTO'].isin(centers)]
        else:
            filtered_df = filtered_df[filtered_df['CENTRO DE MANTENIMIENTO'] == centers]

    # Filter by Building if provided
    if buildings:
        if isinstance(buildings, list):
            filtered_df = filtered_df[filtered_df['EDIFICIO'].isin(buildings)]
        else:
            filtered_df = filtered_df[filtered_df['EDIFICIO'] == buildings]

    return filtered_df

def main():
    path = "data/data" # Update this path
    df = read_files_in_dir(path)
    cm = 'CM ABASTOS'


    df = filter_maintenance_data(df, centers=cm, buildings=None)
    breakpoint()
    cols_to_sum = [
        'A.- Cob',
        'B.- NC',
        'C.- OC',
        'D.- INC',
        'E.- TNP',
        'F.- Intentos',
        'Paso',
        'Bloi',
        'Bloe',
        'FTS',
        'FTE',
        'OPR',
        'Vacantes',
        'Falla Tecnica'
    ]
    ids = ['CLLI_REAL', 'EDIFICIO', 'CENTRO DE MANTENIMIENTO']


    df_m, df_a = process_data(df, cols_to_sum, ids)
    os.makedirs("docs", exist_ok=True)
    plot_interactive_data(df_m, cols_to_sum, "docs/index.html")
    plot_buildings_dashboard(df_m, cols_to_sum, "docs/buildings.html")
    return df_m, df_a

def plot_buildings_dashboard(df, columns_to_plot, file_path):
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=("Escala lineal", "Escala logarítmica (permite ver valores pequeños)"),
        vertical_spacing=0.12
    )

    months = sorted(df['month'].unique())
    buildings = ["All"] + sorted(df['CLLI_REAL'].unique())

    # Initial data (first column, all buildings)
    initial_col = columns_to_plot[0]
    initial_dff = df

    # Create initial traces
    for m in months:
        month_df = initial_dff[initial_dff['month'] == m]
        fig.add_trace(go.Bar(x=month_df['EDIFICIO'], y=month_df[initial_col], name=f"{m}", hovertext=month_df['CLLI_REAL']), row=1, col=1)
        fig.add_trace(go.Bar(x=month_df['EDIFICIO'], y=month_df[initial_col], name=f"{m}", showlegend=False, hovertext=month_df['CLLI_REAL']), row=2, col=1)

    buttons = []
    for col in columns_to_plot:
        for building in buildings:
            if building == "All":
                dff = df
            else:
                dff = df[df['CLLI_REAL'] == building]
            
            x_vals_for_update = []
            y_vals_for_update = []
            hover_text_for_update = []

            for m in months:
                month_df = dff[dff['month'] == m]
                x_vals_for_update.append(month_df['EDIFICIO']) # for linear
                x_vals_for_update.append(month_df['EDIFICIO']) # for log
                y_vals_for_update.append(month_df[col]) # for linear
                y_vals_for_update.append(month_df[col]) # for log
                hover_text_for_update.append(month_df['CLLI_REAL']) # for linear
                hover_text_for_update.append(month_df['CLLI_REAL']) # for log
            
            buttons.append(dict(
                label=f"{col} - {building}",
                method="restyle",
                args=[{"x": x_vals_for_update, "y": y_vals_for_update, "hovertext": hover_text_for_update}]
            ))

    fig.update_layout(
        updatemenus=[dict(
            active=0,
            buttons=buttons,
            direction="down",
            pad={"r": 10, "t": 10},
            showactive=True,
            x=0.1,
            xanchor="left",
            y=1.1,
            yanchor="top"
        )]
    )

    # Formatting
    fig.update_yaxes(type="log", row=2, col=1)
    fig.update_layout(
        height=900,
        title_text="Análisis de incidencias (eje Y) por central (eje X) y meses",
        barmode='group',
        legend_title="Meses"
    )
    fig.write_html(file_path)


if __name__ == "__main__":
    main_df_m, main_df_a = main()
