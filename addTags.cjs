const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const replacement = `
                      <div className="space-y-2 md:col-span-2">
                        <Label>Categorization Tags</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add tag (Press Enter)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && tagInput.trim()) {
                                e.preventDefault();
                                if (!(currentSimpleCourse.tags || []).includes(tagInput.trim())) {
                                  setCurrentSimpleCourse({
                                    ...currentSimpleCourse,
                                    tags: [...(currentSimpleCourse.tags || []), tagInput.trim()],
                                  });
                                }
                                setTagInput("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(currentSimpleCourse.tags || []).map((t) => (
                            <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => {
                              setCurrentSimpleCourse({
                                ...currentSimpleCourse,
                                tags: currentSimpleCourse.tags.filter((tag) => tag !== t),
                              });
                            }}>
                              {t} &times;
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
`;

const updated = content.replace(
  '</div>\n\n                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">',
  replacement
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', updated);
console.log("Updated tags successfully");
