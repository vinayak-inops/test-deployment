import { Laptop, Lightbulb, Award } from "lucide-react"
import { Card } from "@repo/ui/components/ui/card"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <main className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-800">
            Welcome back, <span className="text-gray-700">Felecia</span>{" "}
            <span className="animate-wave inline-block">👋</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Your progress this week is Awesome. let&apos;s keep it up and get a lot of points reward!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Hours Spent Card */}
          <Card className="overflow-hidden">
            <div className="flex items-center p-6">
              <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
                <Laptop className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hours Spent</p>
                <h3 className="text-4xl font-bold text-indigo-500">34h</h3>
              </div>
            </div>
          </Card>

          {/* Test Results Card */}
          <Card className="overflow-hidden">
            <div className="flex items-center p-6">
              <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-lg bg-cyan-100">
                <Lightbulb className="h-8 w-8 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Test Results</p>
                <h3 className="text-4xl font-bold text-cyan-500">82%</h3>
              </div>
            </div>
          </Card>

          {/* Course Completed Card */}
          <Card className="overflow-hidden">
            <div className="flex items-center p-6">
              <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-lg bg-amber-100">
                <Award className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Course Completed</p>
                <h3 className="text-4xl font-bold text-amber-500">14</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-medium text-gray-800">Recent Activity</h2>
          <Card>
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="mr-4 h-10 w-10 rounded-full bg-gray-100"></div>
                    <div>
                      <p className="font-medium text-gray-800">Completed Module {item}</p>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Courses Section */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-medium text-gray-800">Upcoming Courses</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((item) => (
              <Card key={item} className="overflow-hidden">
                <div className="p-6">
                  <h3 className="font-medium text-gray-800">Advanced Web Development</h3>
                  <p className="mt-1 text-sm text-gray-500">Starts in 3 days</p>
                  <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
                    <div className="h-2 w-1/3 rounded-full bg-indigo-500"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
