import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js';

interface LineChartProps {
  data: any[];
  column: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, column }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      // Get unique sorted months for the X axis
      const yearMonths = Array.from(new Set(data.map(item => `${item.year}-${item.month}`))).sort();
      
      // Get unique buildings (CLLI_REAL)
      const buildings = Array.from(new Set(data.map(item => item.CLLI_REAL))).sort();

      const traces = buildings.map(building => {
        const buildingData = data.filter(item => item.CLLI_REAL === building);
        
        // Map data to the sorted months to ensure correct alignment
        const yValues = yearMonths.map(ym => {
          const [year, month] = ym.split('-');
          const record = buildingData.find(item => item.year === year && item.month === month);
          return record ? record[column] : null;
        });

        const edificioName = buildingData[0]?.EDIFICIO || building;

        return {
          x: yearMonths,
          y: yValues,
          name: `${building} - ${edificioName}`,
          type: 'scatter',
          mode: 'lines+markers',
          connectgaps: true
        };
      });

      const layout: any = {
        title: {
          text: `Evolución Temporal: ${column}`,
        },
        xaxis: {
          title: {
            text: 'Mes (Año-Mes)',
          },
          tickangle: -45
        },
        yaxis: {
          title: {
            text: column,
          },
          type: 'log',
          autorange: true
        },
        paper_bgcolor: '#1f2937', // bg-gray-800
        plot_bgcolor: '#1f2937', // bg-gray-800
        font: {
          color: '#ffffff'
        },
        legend: {
          orientation: 'h',
          y: -0.2
        },
        margin: {
            b: 100
        }
      };

      const config = {
        responsive: true
      };

      Plotly.newPlot(chartRef.current, traces as any, layout, config);
    }
  }, [data, column]);

  return <div ref={chartRef} style={{ width: '100%', height: '600px' }} />;
};

export default LineChart;
