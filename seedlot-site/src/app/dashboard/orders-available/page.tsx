export default function OrdersAvailablePage() {
    return (
      <div className="space-y-12 px-8">
  
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">All Available Orders For Your Location</h1>
      </div>
      
      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Farm
                </th>
                <th scope="col" className="px-6 py-3">
                  Investor
                </th>
                <th scope="col" className="px-6 py-3">
                  Lots
                </th>
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  Toraja
                </th>
                <td className="px-6 py-4">Jason</td>
                <td className="px-6 py-4">100</td>
                <td className="px-6 py-4">Accept</td>
              </tr>
              
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  }
  