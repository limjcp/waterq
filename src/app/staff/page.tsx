export default function StaffPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100 p-8">
      <header className="mb-16">
        {" "}
        {/* Increased margin bottom */}
        <h1 className="text-5xl font-bold text-blue-900 drop-shadow-md text-center">
          {" "}
          {/* Centered, larger text, darker color, stronger shadow */}
          Staff Dashboard
        </h1>
        {/* Optional: Add a subtitle or description */}
        {/* <p className="text-center text-blue-700 mt-2">Manage your tasks and resources</p> */}
      </header>

      {/* Added a container with subtle background for contrast */}
      <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-inner">
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Example Widget 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200/80">
            <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
              {" "}
              {/* Flex container for icon + title */}
              {/* Replace [Icon] with your actual icon component */}
              <span className="mr-3 text-2xl text-cyan-600">[Icon]</span>
              <h2 className="text-xl font-semibold text-cyan-800">
                {" "}
                {/* Adjusted text size and color */}
                Water Quality Alerts
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              {" "}
              {/* Adjusted text size */}
              View recent water quality alerts and updates.
            </p>
            {/* Add specific content or components here */}
          </div>

          {/* Example Widget 2 */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200/80">
            <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
              <span className="mr-3 text-2xl text-cyan-600">[Icon]</span>
              <h2 className="text-xl font-semibold text-cyan-800">
                Scheduled Maintenance
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Upcoming system maintenance and tasks.
            </p>
            {/* Add specific content or components here */}
          </div>

          {/* Example Widget 3 */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200/80">
            <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
              <span className="mr-3 text-2xl text-cyan-600">[Icon]</span>
              <h2 className="text-xl font-semibold text-cyan-800">
                Resource Management
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Manage equipment and staff assignments.
            </p>
            {/* Add specific content or components here */}
          </div>

          {/* Add more widgets as needed, following the same style */}
        </main>
      </div>
    </div>
  );
}
