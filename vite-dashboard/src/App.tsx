import { useState, useEffect } from 'react';
import './App.css';
import { DataTable } from './DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import Chart from './Chart';
import LineChart from './LineChart';

// Define the type for a single row of data
interface DataRow {
  'CENTRO DE MANTENIMIENTO': string;
  CLLI_REAL: string;
  EDIFICIO: string;
  'A.- Cob': number;
  'B.- NC': number;
  'C.- OC':number;
  'D.- INC': number;
  'E.- TNP': number;
  'F.- Intentos': number;
  Paso: number;
  Bloi: number;
  Bloe: number;
  FTS: number;
  FTE: number;
  OPR: number;
  Vacantes: number;
  'Falla Tecnica': number;
  TIPO: string;
  TECNOLOGIA: string;
  NOMBRE: string;
  year: string;
  month: string;
}

const columns: ColumnDef<DataRow>[] = [
  {
    accessorKey: 'CLLI_REAL',
    header: 'Building',
  },
  {
    accessorKey: 'EDIFICIO',
    header: 'Edificio',
  },
  {
    accessorKey: 'month',
    header: 'Month',
  },
  {
    accessorKey: 'year',
    header: 'Year',
  },
  {
    accessorKey: 'Bloi',
    header: 'Bloi',
  },
  {
    accessorKey: 'FTE',
    header: 'FTE',
  },
];

const numericColumns = [
  'A.- Cob', 'B.- NC', 'C.- OC', 'D.- INC', 'E.- TNP', 'F.- Intentos', 'Paso',
  'Bloi', 'Bloe', 'FTS', 'FTE', 'OPR', 'Vacantes', 'Falla Tecnica'
].sort();

function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCentro, setSelectedCentro] = useState<string>('All');
  const [selectedBuildingEdificio, setSelectedBuildingEdificio] = useState<string>('All');
  const [selectedColumn, setSelectedColumn] = useState<string>(numericColumns[0]);
  const [monthsCount, setMonthsCount] = useState<number>(12);
  const [viewMode, setViewMode] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We'll try to fetch data for the last 3 years (2024, 2025 and 2026) 
        // to show we can handle more data if it exists.
        const years = ['24', '25', '26'];
        const allData: DataRow[] = [];
        
        for (const year of years) {
          for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            const fileName = `Q${year}${month}`;
            try {
              const response = await fetch(`${import.meta.env.BASE_URL}data/${fileName}.json`);
              if (!response.ok) continue;
              const jsonData: DataRow[] = await response.json();
              allData.push(...jsonData);
            } catch (err) {
              // Ignore missing files
            }
          }
        }
        
        setData(allData);
      } catch (e) {
        setError('Failed to fetch data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset child filter when parent changes
  useEffect(() => {
    setSelectedBuildingEdificio('All');
  }, [selectedCentro]);

  // Sort and filter data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = `${a.year}-${a.month}`;
    const dateB = `${b.year}-${b.month}`;
    return dateA.localeCompare(dateB);
  });

  const uniqueMonths = Array.from(new Set(sortedData.map(item => `${item.year}-${item.month}`))).sort();
  const selectedMonths = uniqueMonths.slice(-monthsCount);

  const timeFilteredData = sortedData.filter(item => 
    selectedMonths.includes(`${item.year}-${item.month}`)
  );

  // Derivations for filters
  const centros = ['All', ...Array.from(new Set(timeFilteredData.map(item => item['CENTRO DE MANTENIMIENTO']))).filter(Boolean).sort()];

  const centroFilteredData = timeFilteredData.filter(item =>
    selectedCentro === 'All' || item['CENTRO DE MANTENIMIENTO'] === selectedCentro
  );

  const buildingEdificioOptions = ['All', ...Array.from(new Set(centroFilteredData.map(item => `${item.CLLI_REAL} - ${item.EDIFICIO}`))).filter(Boolean).sort()];

  const filteredData = centroFilteredData.filter(item => {
    const combined = `${item.CLLI_REAL} - ${item.EDIFICIO}`;
    return selectedBuildingEdificio === 'All' || combined === selectedBuildingEdificio;
  });

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="p-4">
        <h1 className="text-3xl font-bold">Dashboard de Análisis de Datos</h1>
      </header>
      <main className="p-4">
        {loading && <p>Loading data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Visualización</h2>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setViewMode('bar')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Gráfico de Barras
                </button>
                <button
                  onClick={() => setViewMode('line')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Gráfico de Líneas
                </button>
              </div>
              <h2 className="text-xl font-semibold mb-2">Filtros</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="months-filter" className="block mb-2 text-sm font-medium">Show Last N Months</label>
                  <select 
                    id="months-filter"
                    value={monthsCount}
                    onChange={(e) => setMonthsCount(Number(e.target.value))}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {[3, 6, 12, 18, 24].map(n => (
                      <option key={n} value={n}>Last {n} months</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="centro-filter" className="block mb-2 text-sm font-medium">Filter by Centro de Mantenimiento</label>
                  <select 
                    id="centro-filter"
                    value={selectedCentro}
                    onChange={(e) => setSelectedCentro(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {centros.map(centro => (
                      <option key={centro} value={centro}>{centro}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="building-edificio-filter" className="block mb-2 text-sm font-medium">Filter by Building & Edificio</label>
                  <select 
                    id="building-edificio-filter"
                    value={selectedBuildingEdificio}
                    onChange={(e) => setSelectedBuildingEdificio(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {buildingEdificioOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="column-filter" className="block mb-2 text-sm font-medium">Select Column to Plot</label>
                  <select 
                    id="column-filter"
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    {numericColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-xl font-semibold mb-2">Visualización</h2>
                {viewMode === 'bar' ? (
                  <Chart data={filteredData} column={selectedColumn} />
                ) : (
                  <LineChart data={filteredData} column={selectedColumn} />
                )}
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-xl font-semibold mb-2">Datos</h2>
                <DataTable columns={columns} data={filteredData} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;