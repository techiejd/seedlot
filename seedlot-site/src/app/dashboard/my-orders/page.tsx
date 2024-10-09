export default function MyOrdersPage() {
    return (
      <div className="space-y-12 px-8">

      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">My Orders</h1>
      </div>
      
      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Lot Name
              </th>
              <th scope="col" className="px-6 py-3">
                Varietal
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Lot Quantity
              </th>
              <th scope="col" className="px-6 py-3">
                Total Amount (USDT)
              </th>
              <th scope="col" className="px-6 py-3">
                Date Ordered
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
              <td className="px-6 py-4">Toraja</td>
              <td className="px-6 py-4">Catuai</td>
              <td className="px-6 py-4">Pending</td>
              <td className="px-6 py-4">10</td>
              <td className="px-6 py-4">$1500</td>
              <td className="px-6 py-4">10/08/24</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
    );
  }
  