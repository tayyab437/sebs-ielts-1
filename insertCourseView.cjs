const fs = require('fs');
const content = fs.readFileSync('src/pages/public/Courses.tsx', 'utf8');

const fourSkillsView = `
          ) : activeCourse?.course_format === "four_skills" ? (
             /* ================= VIEW 2.5: FOUR SKILLS SIMPLE CLASSROOM ================= */
            <motion.div 
              key="four-skills-classroom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[600px] flex flex-col pb-24"
            >
              <div className="w-full max-w-5xl mx-auto space-y-6">
                <Card className="rounded-[2.5rem] border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 p-6 sm:p-10">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-none text-[9px] font-black uppercase tracking-wider mb-2">Four Skills Focus Series</Badge>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeCourse.title}</h2>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-200 dark:border-white/10 shrink-0"
                      onClick={() => setActiveCourseId(null)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back to Catalog
                    </Button>
                  </div>
                  
                  {/* Skill Navigation */}
                  <div className="flex flex-wrap items-center gap-2 mb-8">
                     {["reading", "writing", "listening", "speaking"].map(skill => (
                        <button
                          key={skill}
                          onClick={() => setActivePartIdx(
                            skill === 'reading' ? 0 : 
                            skill === 'writing' ? 1 : 
                            skill === 'listening' ? 2 : 3
                          )}
                          className={\`h-10 px-4 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all flex items-center gap-2 border select-none \${
                            activePartIdx === (skill === 'reading' ? 0 : skill === 'writing' ? 1 : skill === 'listening' ? 2 : 3) 
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          }\`}
                        >
                          {skill === 'reading' && <BookOpen className="w-4 h-4" />}
                          {skill === 'writing' && <PenTool className="w-4 h-4" />}
                          {skill === 'listening' && <Volume2 className="w-4 h-4" />}
                          {skill === 'speaking' && <Mic className="w-4 h-4" />}
                          <span>{skill}</span>
                        </button>
                     ))}
                  </div>

                  {/* Skill Content Area */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 sm:p-10 rounded-[2rem] border border-slate-100 dark:border-white/5 min-h-[400px]">
                    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                      {activePartIdx === 0 && (
                        activeCourse.readingContent 
                        ? <div dangerouslySetInnerHTML={{ __html: activeCourse.readingContent }} />
                        : <p className="text-slate-400 italic">No reading materials provided yet.</p>
                      )}
                      {activePartIdx === 1 && (
                        activeCourse.writingContent 
                        ? <div dangerouslySetInnerHTML={{ __html: activeCourse.writingContent }} />
                        : <p className="text-slate-400 italic">No writing tasks provided yet.</p>
                      )}
                      {activePartIdx === 2 && (
                        activeCourse.listeningContent 
                        ? <div dangerouslySetInnerHTML={{ __html: activeCourse.listeningContent }} />
                        : <p className="text-slate-400 italic">No listening materials provided yet.</p>
                      )}
                      {activePartIdx === 3 && (
                        activeCourse.speakingContent 
                        ? <div dangerouslySetInnerHTML={{ __html: activeCourse.speakingContent }} />
                        : <p className="text-slate-400 italic">No speaking prompts provided yet.</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : (
             /* ================= VIEW 2: SPLIT SCREEN INTERACTIVE CLASSROOM READER ================= */`;

const regex = /\)\s*:\s*\(\s*\/\*\s*={17}\s*VIEW 2: SPLIT SCREEN INTERACTIVE CLASSROOM READER\s*={17}\s*\*\//;
if (!regex.test(content)) {
  console.error("Could not find the target string 'VIEW 2: SPLIT SCREEN INTERACTIVE CLASSROOM READER'");
} else {
  const updated = content.replace(regex, fourSkillsView);
  fs.writeFileSync('src/pages/public/Courses.tsx', updated);
  console.log("Updated Courses.tsx successfully.");
}
