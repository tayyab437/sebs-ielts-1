const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const designerTabContent = `
                <TabsContent value="course-designer" className="mt-0 space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Course Designer</h2>
                      <p className="text-slate-500">Design rapid four-skill courses.</p>
                    </div>
                    <Button 
                      className="rounded-xl shadow-lg border-none"
                      onClick={() => {
                        const payload = {
                          id: currentSimpleCourse.id || undefined,
                          title: currentSimpleCourse.title,
                          level: currentSimpleCourse.level,
                          type: currentSimpleCourse.type,
                          difficulty: currentSimpleCourse.difficulty,
                          description: currentSimpleCourse.description,
                          tags: currentSimpleCourse.tags,
                          course_format: currentSimpleCourse.course_format,
                          featured_image: currentSimpleCourse.featured_image,
                          readingContent: currentSimpleCourse.readingContent,
                          writingContent: currentSimpleCourse.writingContent,
                          listeningContent: currentSimpleCourse.listeningContent,
                          speakingContent: currentSimpleCourse.speakingContent,
                        };
                        handleSave("courses", payload, () => {});
                        setCurrentSimpleCourse({
                          title: "",
                          level: "7.0",
                          type: "Academic",
                          difficulty: "Intermediate",
                          description: "",
                          tags: [],
                          course_format: "four_skills",
                          readingContent: "",
                          writingContent: "",
                          listeningContent: "",
                          speakingContent: "",
                          status: "Published",
                          featured_image: "",
                        });
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Course"}
                    </Button>
                  </div>

                  <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white dark:bg-slate-900 p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Course Title</Label>
                        <Input
                          placeholder="e.g. Rapid Academic Training"
                          value={currentSimpleCourse.title}
                          onChange={(e) => setCurrentSimpleCourse({...currentSimpleCourse, title: e.target.value})}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Exam Type (AC/GT)</Label>
                        <select
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={currentSimpleCourse.type}
                          onChange={(e) => setCurrentSimpleCourse({...currentSimpleCourse, type: e.target.value})}
                        >
                          <option value="Academic">Academic</option>
                          <option value="General Training">General Training</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Target Band Score</Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 7.5"
                          value={currentSimpleCourse.level}
                          onChange={(e) => setCurrentSimpleCourse({...currentSimpleCourse, level: e.target.value})}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <select
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={currentSimpleCourse.difficulty}
                          onChange={(e) => setCurrentSimpleCourse({...currentSimpleCourse, difficulty: e.target.value})}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Short description of the course..."
                          value={currentSimpleCourse.description}
                          onChange={(e) => setCurrentSimpleCourse({...currentSimpleCourse, description: e.target.value})}
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                      <h3 className="font-bold text-lg">Course Materials (Four Skills)</h3>
                      
                      <div className="space-y-2">
                        <Label>Reading Content</Label>
                        <RichTextEditor
                          value={currentSimpleCourse.readingContent}
                          onChange={(val) => setCurrentSimpleCourse({...currentSimpleCourse, readingContent: val})}
                          placeholder="Enter reading passage and questions..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Writing Content</Label>
                        <RichTextEditor
                          value={currentSimpleCourse.writingContent}
                          onChange={(val) => setCurrentSimpleCourse({...currentSimpleCourse, writingContent: val})}
                          placeholder="Enter writing task instructions..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Listening Content</Label>
                        <RichTextEditor
                          value={currentSimpleCourse.listeningContent}
                          onChange={(val) => setCurrentSimpleCourse({...currentSimpleCourse, listeningContent: val})}
                          placeholder="Enter listening transcript or audio link..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Speaking Content</Label>
                        <RichTextEditor
                          value={currentSimpleCourse.speakingContent}
                          onChange={(val) => setCurrentSimpleCourse({...currentSimpleCourse, speakingContent: val})}
                          placeholder="Enter speaking prompts..."
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>
`;

const updated = content.replace(
  '<TabsContent value="mock-tests" className="mt-0">',
  designerTabContent + '\n                <TabsContent value="mock-tests" className="mt-0">'
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', updated);
console.log("Updated AdminDashboard.tsx successfully.");
