import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { 
  BookOpen, 
  CheckCircle, 
  Award, 
  Zap, 
  PlayCircle,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

interface CourseProgressTrackerProps {
  chartData: Array<{
    id: string;
    name: string;
    shortName: string;
    type: string;
    completed: number;
    total: number;
    percentage: number;
    fill: string;
    lessons: Array<{ id: string; title: string }>;
  }>;
  onQuickStudy: (courseId: string) => void;
  onSetActiveTab: (tab: "overview" | "settings" | "resources" | "courses" | "writing" | "speaking" | "listening" | "reading") => void;
}

const CourseProgressCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl text-white text-left max-w-xs space-y-1.5 font-sans">
        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Course Syllabus status</p>
        <p className="font-extrabold text-sm leading-tight text-white">{data.name}</p>
        <div className="flex items-center gap-4 pt-1">
          <div>
            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Completion</span>
            <span className="text-lg font-black text-indigo-400">{data.percentage}%</span>
          </div>
          <div className="h-6 w-[1px] bg-white/15" />
          <div>
            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Lessons Done</span>
            <span className="text-lg font-black text-slate-200">{data.completed} / {data.total}</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 font-bold italic pt-1 border-t border-white/5">{data.type} Training Track</p>
      </div>
    );
  }
  return null;
};

export default function CourseProgressTracker({ 
  chartData, 
  onQuickStudy, 
  onSetActiveTab 
}: CourseProgressTrackerProps) {
  
  const handleLaunchCourse = (courseId: string) => {
    localStorage.setItem("active_course_id", courseId);
    localStorage.setItem("active_course_timestamp", Date.now().toString());
    onSetActiveTab("courses");
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div id="course-progress-analytics-section" className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Enrolled Course Analytics
            </h2>
            <p className="text-xs text-slate-500 font-medium italic">
              Track your student success syllabus progress metrics.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary font-black text-[9px] uppercase tracking-wide">
            Active Analytics
          </Badge>
        </div>

        <Card className="rounded-[2rem] border-none bg-white dark:bg-slate-900 shadow-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Start Your English Mastery Path</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              We couldn't detect any active syllabus courses. Open the Academic Courses area to sign up for Spoken English or IELTS prep modules, complete learning units, and generate real-time metrics!
            </p>
          </div>
          <Button 
            onClick={() => onSetActiveTab("courses")}
            className="rounded-2xl text-xs font-black bg-primary text-white hover:bg-primary/90 px-6 py-5 uppercase tracking-widest gap-2 shadow-lg shadow-primary/25 cursor-pointer transition-all hover:scale-[1.02]"
          >
            Explore Academic Courses
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div id="course-progress-analytics-section" className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Enrolled Course Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium italic">
            Visual completion percentages across active preparation tracks.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/20 text-primary font-black text-[9px] uppercase tracking-wide">
          <TrendingUp className="w-3 h-3 mr-1" /> Recharts Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recharts chart Card - taking 2/3 cols on desktop */}
        <Card className="rounded-[2rem] border-none bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-8 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-none">Completion Status</h3>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider block">Visual course progress benchmark</span>
                </div>
              </div>
              <Badge className="bg-primary/10 hover:bg-primary/20 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-wide border-none shadow-none">
                Syllabus Metrics
              </Badge>
            </div>
          </div>

          {/* Core Recharts component with key tracking and 99% size fix to force reflow on mounting inside iframes */}
          <div className="h-[280px] w-full pt-6">
            <ResponsiveContainer width="99%" height="100%" key={`recharts-course-progress-${chartData.length}`}>
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis 
                  dataKey="shortName" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                  width={110}
                />
                <Tooltip content={<CourseProgressCustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }} />
                <Bar 
                  dataKey="percentage" 
                  radius={[0, 10, 10, 0]} 
                  barSize={18}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[9px] text-slate-400 italic text-left mt-4 border-t border-slate-100 dark:border-white/5 pt-3">
            Your progress represents the proportion of finished lessons with respect to total modules listed. Check out your interactive quick-study card for fast revisions.
          </p>
        </Card>

        {/* Detailed action cards - taking 1/3 col on desktop */}
        <Card className="rounded-[2rem] border-none bg-white dark:bg-slate-900 shadow-xl p-6 sm:p-8 flex flex-col gap-4 overflow-y-auto max-h-[380px] lg:max-h-none no-scrollbar">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 leading-none">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Syllabus Direct Study
            </h3>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Live Controls</span>
          </div>

          <div className="space-y-4">
            {chartData.map((course: any) => {
              const allLessons = course.lessons || [];
              const nextUncompleted = allLessons.find((l: any) => l.id && l.id); // placeholder logic checked later
              const isFinished = course.percentage >= 100;

              return (
                <div 
                  key={course.id} 
                  className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge 
                          className="font-black text-[8px] uppercase tracking-wider border-none py-0 px-1.5 h-4 text-white"
                          style={{ backgroundColor: course.fill }}
                        >
                          {course.type}
                        </Badge>
                        {isFinished && (
                          <Badge className="bg-emerald-500 text-white font-black text-[8px] border-none py-0 px-1.5 h-4">
                            FINISHED
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">
                        {course.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">
                      {course.completed} / {course.total} Lns
                    </span>
                  </div>

                  {/* Standard utility progress bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ width: `${course.percentage}%`, backgroundColor: course.fill }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                      <span>Completion: {course.percentage}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                    {/* Launch Course Tab Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLaunchCourse(course.id)}
                      className="px-2 h-7 rounded-lg text-[9px] font-extrabold hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 gap-1 flex-1 cursor-pointer"
                    >
                      <PlayCircle className="w-3 h-3 text-primary" />
                      Study Screen
                    </Button>
                    
                    {/* Quick Simulation complete action */}
                    {!isFinished && (
                      <Button
                        size="sm"
                        onClick={() => onQuickStudy(course.id)}
                        className="px-2.1 h-7 rounded-lg text-[9px] font-black bg-primary/10 hover:bg-primary hover:text-white text-primary uppercase tracking-widest gap-1 flex-1 shadow-none transition-colors cursor-pointer"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        Quick Done (+150 XP)
                      </Button>
                    )}
                    {isFinished && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-extrabold italic select-none pl-2 flex-1 justify-center py-1">
                        <CheckCircle className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                        Fully Mastered
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
}
