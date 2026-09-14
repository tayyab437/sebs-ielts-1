export function getQuestionCorrectIndex(q: any): number {
  if (!q) return 0;

  // 1. Direct numeric correctIndex property if present
  if (q.correctIndex !== undefined && q.correctIndex !== null && q.correctIndex !== "") {
    const parsed = typeof q.correctIndex === "number" ? q.correctIndex : parseInt(String(q.correctIndex).trim(), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  // 2. Check if correctIndexes array is present (e.g. MULTI_MCQ)
  if (Array.isArray(q.correctIndexes) && q.correctIndexes.length > 0) {
    const first = Number(q.correctIndexes[0]);
    if (!isNaN(first) && first >= 0) return first;
  }

  // 3. Extract raw answer string from any potential property
  const rawAns = String(
    q.correctAnswer ?? 
    q.answer ?? 
    q.correct ?? 
    q.data?.correctAnswer ?? 
    q.data?.answer ?? 
    q.data?.correct ?? 
    ""
  ).trim();

  if (!rawAns) return 0;

  const qType = String(q.type || "").toUpperCase();
  const defaultTfOpts = qType === "YN" ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];
  const options = Array.isArray(q.options) && q.options.length > 0 
    ? q.options 
    : defaultTfOpts;

  const rawUpper = rawAns.toUpperCase();

  // Digit string ("0", "1", "2", "3")
  if (/^\d+$/.test(rawAns)) {
    const num = parseInt(rawAns, 10);
    if (num >= 0 && num < (options.length || 10)) {
      return num;
    }
  }

  // Exact match against options array
  const exactIdx = options.findIndex((opt: any) => String(opt).toLowerCase().trim() === rawAns.toLowerCase());
  if (exactIdx !== -1) return exactIdx;

  // True / False / Not Given & Yes / No / Not Given
  if (qType === "TF" || qType === "YN" || qType === "TRUE-FALSE-NOT-GIVEN" || qType === "YES-NO-NOT-GIVEN" || options.includes("TRUE") || options.includes("YES")) {
    if (rawUpper === "TRUE" || rawUpper === "T" || rawUpper === "YES" || rawUpper === "Y") {
      const idx = options.findIndex((o: any) => String(o).toUpperCase().trim().startsWith("TR") || String(o).toUpperCase().trim().startsWith("YE"));
      return idx !== -1 ? idx : 0;
    }
    if (rawUpper === "FALSE" || rawUpper === "F" || rawUpper === "NO" || rawUpper === "N") {
      const idx = options.findIndex((o: any) => String(o).toUpperCase().trim().startsWith("FA") || String(o).toUpperCase().trim().startsWith("NO"));
      return idx !== -1 ? idx : 1;
    }
    if (rawUpper.includes("NOT") || rawUpper === "NG" || rawUpper === "NOTGIVEN") {
      const idx = options.findIndex((o: any) => String(o).toUpperCase().trim().includes("NOT"));
      return idx !== -1 ? idx : 2;
    }
  }

  // Letter choices ("A", "B", "C", "D", "Option A", "A.", "A)", "A: ")
  if (rawUpper === "A" || rawUpper.startsWith("OPTION A") || /^A[\.\:\)\s]/.test(rawUpper)) return 0;
  if (rawUpper === "B" || rawUpper.startsWith("OPTION B") || /^B[\.\:\)\s]/.test(rawUpper)) return 1;
  if (rawUpper === "C" || rawUpper.startsWith("OPTION C") || /^C[\.\:\)\s]/.test(rawUpper)) return 2;
  if (rawUpper === "D" || rawUpper.startsWith("OPTION D") || /^D[\.\:\)\s]/.test(rawUpper)) return 3;

  // Partial string match against option texts
  const partialIdx = options.findIndex((opt: any) => {
    const oStr = String(opt).toLowerCase().trim();
    const aStr = rawAns.toLowerCase();
    const oClean = oStr.replace(/^(option\s+[a-d][:\s]*|[a-d][.\)\:\s]+)/i, "").trim();
    return oClean && (oClean === aStr || aStr.includes(oClean) || oClean.includes(aStr));
  });
  if (partialIdx !== -1) return partialIdx;

  return 0;
}

export function flattenQuestionsToIndividual(questionsList: any[], startQNum: number = 1): any[] {
  if (!Array.isArray(questionsList)) return [];
  const result: any[] = [];
  let currentNum = startQNum;

  questionsList.forEach((rawQ: any, qIdx: number) => {
    if (!rawQ) return;

    // Unpack data payload if present
    const payload = rawQ.data || {};
    const q = {
      ...payload,
      ...rawQ,
      text: rawQ.text || payload.text || payload.question || payload.statement || payload.prompt || "",
      options: (Array.isArray(rawQ.options) && rawQ.options.length > 0) ? rawQ.options : (Array.isArray(payload.options) ? payload.options : []),
      correctAnswer: rawQ.correctAnswer ?? payload.correctAnswer ?? payload.answers ?? payload.answer ?? payload.correct ?? "",
      sectionHeading: rawQ.sectionHeading || payload.sectionHeading || payload.title || payload.heading || "",
      sectionInstruction: rawQ.sectionInstruction || payload.sectionInstruction || payload.instruction || "",
      type: rawQ.type || payload.type || "MCQ"
    };

    const qType = String(q.type || "").toUpperCase();

    // 0. Check if q is a paragraph with inline blanks (INLINE_BLANKS)
    const answersStr = String(q.correctAnswer || q.answers || q.data?.answers || q.data?.correctAnswer || "");
    const isInlineBlanks = qType === "INLINE_BLANKS" || 
                           ((qType === "FILL-BLANKS" || qType === "BLANK" || qType === "SUMMARY-COMPLETION" || qType === "SENTENCE-COMPLETION") && answersStr.includes("|"));

    if (isInlineBlanks) {
      const answersList = answersStr.split("|");
      const numBlanks = Math.max(1, answersList.length);
      const itemQNum = q.qNum || q.questionNumber || q._origQNum || currentNum;
      
      result.push({
        ...q,
        id: q.id || `inline_blank_${itemQNum}_${Math.random().toString(36).substring(2, 7)}`,
        type: "INLINE_BLANKS",
        qNum: itemQNum,
        _origQNum: itemQNum,
        sectionNumber: q.sectionNumber || q.section || (q._sectionIndex !== undefined ? q._sectionIndex + 1 : 1)
      });
      currentNum = Math.max(currentNum, itemQNum + numBlanks);
      return;
    }

    // 1. Check if q has a statements array (e.g. TF / True-False / Yes-No)
    if (Array.isArray(q.statements) && q.statements.length > 0) {
      const heading = q.sectionHeading || q.data?.sectionHeading || "True / False / Not Given";
      const instruction = q.sectionInstruction || q.data?.sectionInstruction || "Do the statements agree with the information in the passage?";
      const isYN = String(q.type || "").toLowerCase().includes("yn") || String(q.type || "").toLowerCase().includes("yes");
      const defaultOpts = isYN ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];

      q.statements.forEach((st: any, sIdx: number) => {
        const itemQNum = st.qNum !== undefined ? st.qNum : (st.qnum !== undefined ? st.qnum : currentNum);
        const itemAns = st.answer || st.correct || st.correctAnswer || "NOT GIVEN";
        const itemOpts = st.options || q.options || defaultOpts;
        const correctIdx = getQuestionCorrectIndex({ type: isYN ? "YN" : "TF", options: itemOpts, correctAnswer: itemAns, ...st });

        result.push({
          id: st.id || `${q.id || "tf"}_stmt_${sIdx}_${itemQNum}`,
          type: isYN ? "YN" : "TF",
          qNum: itemQNum,
          _origQNum: itemQNum,
          text: st.text || st.statement || "",
          options: itemOpts,
          correctAnswer: itemAns,
          correctIndex: correctIdx,
          sectionHeading: sIdx === 0 ? heading : "",
          sectionInstruction: sIdx === 0 ? instruction : "",
          sectionNumber: q.sectionNumber || q.section || (q._sectionIndex !== undefined ? q._sectionIndex + 1 : 1)
        });
        currentNum = Math.max(currentNum, itemQNum + 1);
      });
      return;
    }

    // 2. Check if q has a sentences array (e.g. Fill in the Blanks / Sentence Completion)
    if (Array.isArray(q.sentences) && q.sentences.length > 0) {
      const heading = q.sectionHeading || q.data?.sectionHeading || "Sentence Completion";
      const instruction = q.sectionInstruction || q.data?.sectionInstruction || "Complete the sentences below.";

      q.sentences.forEach((st: any, sIdx: number) => {
        const itemQNum = st.qNum !== undefined ? st.qNum : (st.qnum !== undefined ? st.qnum : currentNum);
        let itemTxt = st.text || st.statement || "";
        let itemAns = st.answer || st.correct || st.correctAnswer || "";
        if (itemTxt.includes("[") && itemTxt.includes("]")) {
          const match = itemTxt.match(/\[([^\]]+)\]/);
          if (match && !itemAns) itemAns = match[1];
          itemTxt = itemTxt.replace(/\[[^\]]+\]/g, "_____");
        }
        result.push({
          id: st.id || `${q.id || "sc"}_sent_${sIdx}_${itemQNum}`,
          type: "BLANK",
          qNum: itemQNum,
          _origQNum: itemQNum,
          text: itemTxt,
          correctAnswer: itemAns,
          options: [],
          sectionHeading: sIdx === 0 ? heading : "",
          sectionInstruction: sIdx === 0 ? instruction : "",
          sectionNumber: q.sectionNumber || q.section
        });
        currentNum = Math.max(currentNum, itemQNum + 1);
      });
      return;
    }

    // 3. Check if q is INLINE_BLANKS / FILL-BLANKS with multiple answers or text lines
    if (qType === "INLINE_BLANKS" || qType === "BLANK" || qType === "FILL-BLANKS" || qType === "SENTENCE-COMPLETION" || qType === "SUMMARY-COMPLETION") {
      const heading = q.sectionHeading || q.data?.sectionHeading || "Fill in the Blanks";
      const instruction = q.sectionInstruction || q.data?.sectionInstruction || "Complete the sentences below.";
      const answersStr = String(q.correctAnswer || q.answers || q.data?.answers || q.data?.correctAnswer || "");
      let rawText = String(q.text || q.statement || q.data?.text || "");
      if (rawText.includes("[") && rawText.includes("]")) {
        rawText = rawText.replace(/\[[^\]]+\]/g, "_____");
      }
      const answersList = answersStr.includes("|") ? answersStr.split("|") : (answersStr ? [answersStr] : []);
      const textLines = rawText.split("\n").filter(Boolean);
      const startNum = q.qNum || q._origQNum || currentNum;

      if (textLines.length > 1 && (answersList.length === textLines.length || textLines.length > 1)) {
        textLines.forEach((line, lIdx) => {
          const itemQNum = startNum + lIdx;
          result.push({
            id: `${q.id || "blank"}_line_${lIdx}_${itemQNum}`,
            type: "BLANK",
            qNum: itemQNum,
            _origQNum: itemQNum,
            text: line,
            correctAnswer: (answersList[lIdx] || "").trim(),
            options: [],
            sectionHeading: lIdx === 0 ? heading : "",
            sectionInstruction: lIdx === 0 ? instruction : "",
            sectionNumber: q.sectionNumber || q.section
          });
          currentNum = Math.max(currentNum, itemQNum + 1);
        });
        return;
      } else if (answersList.length > 1) {
        const sentencesList = rawText.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
        answersList.forEach((ans, aIdx) => {
          const itemQNum = startNum + aIdx;
          const sentenceTxt = (sentencesList.length === answersList.length) ? sentencesList[aIdx] : rawText;
          result.push({
            id: `${q.id || "blank"}_item_${aIdx}_${itemQNum}`,
            type: "BLANK",
            qNum: itemQNum,
            _origQNum: itemQNum,
            text: sentenceTxt || rawText,
            correctAnswer: ans.trim(),
            options: [],
            sectionHeading: aIdx === 0 ? heading : "",
            sectionInstruction: aIdx === 0 ? instruction : "",
            sectionNumber: q.sectionNumber || q.section
          });
          currentNum = Math.max(currentNum, itemQNum + 1);
        });
        return;
      }
    }

    // 4. Check if q is MATCHING with multiple items
    if (qType === "MATCHING" || qType === "MATCHING-HEADINGS" || qType === "MATCHING-INFORMATION" || qType === "MATCHING-FEATURES") {
      const heading = q.sectionHeading || q.data?.sectionHeading || "Matching";
      const instruction = q.sectionInstruction || q.data?.sectionInstruction || "Match the correct items.";
      const paragraphs = q.paragraphs || q.data?.paragraphs || q.statements || q.data?.statements || [];
      
      // Extremely robust options/headings extractor
      const getRawOptions = () => {
        if (q.data) {
          if (Array.isArray(q.data.headings) && q.data.headings.length > 0) return q.data.headings;
          if (Array.isArray(q.data.options) && q.data.options.length > 0) return q.data.options;
          if (typeof q.data.headings === "string" && q.data.headings.trim()) return q.data.headings.split("\n").filter(Boolean);
          if (typeof q.data.options === "string" && q.data.options.trim()) return q.data.options.split("\n").filter(Boolean);
        }
        if (Array.isArray(q.headings) && q.headings.length > 0) return q.headings;
        if (Array.isArray(q.options) && q.options.length > 0) return q.options;
        if (typeof q.passageText === "string" && q.passageText.trim()) return q.passageText.split("\n").filter(Boolean);
        if (typeof q.headings === "string" && q.headings.trim()) return q.headings.split("\n").filter(Boolean);
        if (typeof q.options === "string" && q.options.trim()) return q.options.split("\n").filter(Boolean);
        return [];
      };
      const optionsList = getRawOptions();
      const startNum = q.qNum || q._origQNum || currentNum;

      if (Array.isArray(paragraphs) && paragraphs.length > 0) {
        paragraphs.forEach((p: any, pIdx: number) => {
          const itemQNum = p.qNum !== undefined ? p.qNum : startNum + pIdx;
          result.push({
            id: p.id || `${q.id || "match"}_p_${pIdx}_${itemQNum}`,
            type: "MATCHING",
            qNum: itemQNum,
            _origQNum: itemQNum,
            text: p.text || p.name || "",
            options: optionsList,
            passageText: optionsList.join("\n"),
            correctAnswer: p.answer || p.correctAnswer || "",
            sectionHeading: pIdx === 0 ? heading : "",
            sectionInstruction: pIdx === 0 ? instruction : "",
            sectionNumber: q.sectionNumber || q.section
          });
          currentNum = Math.max(currentNum, itemQNum + 1);
        });
        return;
      }

      const promptStr = String(q.text || q.data?.text || "");
      const promptsList = promptStr.split("\n").filter(Boolean);
      const answersStr = String(q.correctAnswer || q.data?.correctAnswer || "");
      const answersList = answersStr.split("\n").filter(Boolean);

      if (promptsList.length > 1) {
        promptsList.forEach((promptText, pIdx) => {
          const itemQNum = startNum + pIdx;
          result.push({
            id: `${q.id || "match"}_item_${pIdx}_${itemQNum}`,
            type: "MATCHING",
            qNum: itemQNum,
            _origQNum: itemQNum,
            text: promptText,
            options: optionsList,
            passageText: optionsList.join("\n"),
            correctAnswer: answersList[pIdx] || answersList[0] || "",
            sectionHeading: pIdx === 0 ? heading : "",
            sectionInstruction: pIdx === 0 ? instruction : "",
            sectionNumber: q.sectionNumber || q.section
          });
          currentNum = Math.max(currentNum, itemQNum + 1);
        });
        return;
      }
    }

    // 5. Standard single question
    const itemQNum = q.qNum || q.questionNumber || q._origQNum || currentNum;
    const resolvedType = (qType === "INLINE_BLANKS" && !String(q.correctAnswer || "").includes("|")) ? "BLANK" : (qType || "MCQ");
    const correctIdx = getQuestionCorrectIndex({ ...q, type: resolvedType });

    result.push({
      ...q,
      id: q.id || `q_${itemQNum}_${Math.random().toString(36).substring(2, 7)}`,
      qNum: itemQNum,
      _origQNum: itemQNum,
      type: resolvedType,
      correctIndex: correctIdx,
      sectionNumber: q.sectionNumber || q.section
    });
    currentNum = Math.max(currentNum, itemQNum + 1);
  });

  return result;
}

function extractSingleSection(
  source: any,
  course: any,
  defaultType: string,
  quizzes: any[],
  defaultId: string,
  moduleIdx: number,
  lessonIdx: number,
  partIdx: number
) {
  const sTypeRaw = String(source.type || defaultType).toLowerCase();
  let sType = defaultType;
  if (sTypeRaw.includes("listen")) sType = "listening";
  else if (sTypeRaw.includes("writ")) sType = "writing";
  else if (sTypeRaw.includes("speak")) sType = "speaking";
  else if (sTypeRaw.includes("read") || sTypeRaw.includes("practice") || sTypeRaw.includes("quiz")) sType = "reading";

  let rawQs: any[] = [];
  if (Array.isArray(source.questions) && source.questions.length > 0) {
    rawQs = source.questions;
  } else if (source.content && Array.isArray(source.content.questions) && source.content.questions.length > 0) {
    rawQs = source.content.questions;
  } else if (source.quiz && Array.isArray(source.quiz.questions) && source.quiz.questions.length > 0) {
    rawQs = source.quiz.questions;
  } else if (source.designer_blocks && Array.isArray(source.designer_blocks.right)) {
    rawQs = source.designer_blocks.right;
  } else if (source.blocks && Array.isArray(source.blocks.right)) {
    rawQs = source.blocks.right;
  } else if (source.quizType === "MASTER_QUIZ" && source.linkedQuizId) {
    const linked = quizzes.find((q) => q.id === source.linkedQuizId);
    if (linked && Array.isArray(linked.questions)) {
      rawQs = linked.questions;
    }
  }

  // Audio fallback
  const audio =
    source.audio ||
    source.audioUrl ||
    source.audio_url ||
    source.audio_link ||
    course.audio_url ||
    course.audioUrl ||
    course.audio ||
    "";

  const transcript_url =
    source.transcript_url ||
    source.transcriptUrl ||
    course.transcript_url ||
    "";

  const transcript_name =
    source.transcript_name ||
    source.transcriptName ||
    course.transcript_name ||
    "Audio Transcript";

  const content =
    source.content ||
    source.passage ||
    (typeof source.data?.text === "string" ? source.data.text : "") ||
    "";

  const image = source.image || source.imageUrl || source.image_url || course.imageUrl || "";

  return {
    id: source.id || defaultId,
    title: source.title || source.name || `Section ${moduleIdx + 1}`,
    type: sType,
    content,
    audio,
    transcript_url,
    transcript_name,
    image,
    questions: rawQs,
    moduleIdx,
    lessonIdx,
    partIdx
  };
}

export function normalizeCourseToSections(course: any, quizzes: any[] = []): any[] {
  if (!course) return [];

  const parseJsonSafe = (val: any) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return val;
  };

  const rawSections = parseJsonSafe(course.sections);
  const rawSyllabus = parseJsonSafe(course.syllabus_structure) || parseJsonSafe(course.syllabus);
  const rawModules = parseJsonSafe(course.modules);
  const rawBlocks = parseJsonSafe(course.designer_blocks) || parseJsonSafe(course.blocks);

  const fallbackList = Array.isArray(rawSections) && rawSections.length > 0
    ? rawSections
    : Array.isArray(rawSyllabus) && rawSyllabus.length > 0
    ? rawSyllabus
    : Array.isArray(rawModules) && rawModules.length > 0
    ? rawModules
    : [];

  let sectionsOut: any[] = [];

  const formatLower = String(
    course.course_type || course.course_format || course.category || course.name || course.title || ""
  ).toLowerCase();
  let defaultType = "reading";
  if (formatLower.includes("listen")) defaultType = "listening";
  else if (formatLower.includes("writ")) defaultType = "writing";
  else if (formatLower.includes("speak")) defaultType = "speaking";

  if (fallbackList.length > 0) {
    const hasNestedLessons = fallbackList.some(
      (item: any) => item && (Array.isArray(item.lessons) || Array.isArray(item.parts) || Array.isArray(item.sections))
    );

    if (hasNestedLessons) {
      fallbackList.forEach((mod: any, mIdx: number) => {
        if (!mod) return;
        const modLessons = Array.isArray(mod.lessons) ? mod.lessons : Array.isArray(mod.parts) ? mod.parts : [];
        if (modLessons.length > 0) {
          modLessons.forEach((les: any, lIdx: number) => {
            if (!les) return;
            const lesParts = Array.isArray(les.parts) ? les.parts : [];
            if (lesParts.length > 0) {
              lesParts.forEach((p: any, pIdx: number) => {
                if (!p) return;
                sectionsOut.push(extractSingleSection(p, course, defaultType, quizzes, `p-${mIdx}-${lIdx}-${pIdx}`, mIdx, lIdx, pIdx));
              });
            } else {
              sectionsOut.push(extractSingleSection(les, course, defaultType, quizzes, `les-${mIdx}-${lIdx}`, mIdx, lIdx, 0));
            }
          });
        } else {
          sectionsOut.push(extractSingleSection(mod, course, defaultType, quizzes, `mod-${mIdx}`, mIdx, 0, 0));
        }
      });
    } else {
      fallbackList.forEach((sec: any, sIdx: number) => {
        if (!sec) return;
        sectionsOut.push(extractSingleSection(sec, course, defaultType, quizzes, sec.id || `sec-${sIdx}`, sIdx, 0, 0));
      });
    }
  } else if (rawBlocks && (rawBlocks.left || rawBlocks.right || rawBlocks.single)) {
    const rightQs = Array.isArray(rawBlocks.right) ? rawBlocks.right : Array.isArray(rawBlocks.single) ? rawBlocks.single : [];
    const leftText = Array.isArray(rawBlocks.left) ? rawBlocks.left.map((b: any) => b.data?.text || b.data?.passage || b.content || "").join("\n\n") : "";
    sectionsOut.push({
      id: course.id || "designer-sec-1",
      title: course.title || "Examination Section",
      type: defaultType,
      content: leftText || course.content || "",
      audio: course.audio_url || course.audioUrl || course.audio || "",
      transcript_url: course.transcript_url || "",
      transcript_name: course.transcript_name || "Audio Transcript",
      image: course.imageUrl || "",
      questions: rightQs,
      moduleIdx: 0,
      lessonIdx: 0,
      partIdx: 0
    });
  } else if (course.course_format === "four_skills") {
    ["listening", "reading", "writing", "speaking"].forEach((skill, idx) => {
      sectionsOut.push({
        id: `four-skills-${skill}`,
        title: skill.charAt(0).toUpperCase() + skill.slice(1),
        type: skill,
        content: course[`${skill}_content`] || course.content || "",
        audio: course.audio_url || course.audioUrl || course.audio || "",
        transcript_url: course.transcript_url || "",
        transcript_name: course.transcript_name || "Audio Transcript",
        image: course.imageUrl || "",
        questions: course[`${skill}_questions`] || [],
        moduleIdx: 0,
        lessonIdx: 0,
        partIdx: idx
      });
    });
  } else {
    sectionsOut.push({
      id: course.id || "sec-single",
      title: course.title || "Practice Section",
      type: defaultType,
      content: course.content || course.passage || "",
      audio: course.audio_url || course.audioUrl || course.audio || "",
      transcript_url: course.transcript_url || "",
      transcript_name: course.transcript_name || "Audio Transcript",
      image: course.imageUrl || "",
      questions: course.questions || [],
      moduleIdx: 0,
      lessonIdx: 0,
      partIdx: 0
    });
  }

  let runningQNum = 1;
  const processedSections = sectionsOut.map((sec) => {
    const rawQs = sec.questions || [];
    const flatQs = flattenQuestionsToIndividual(rawQs, runningQNum);
    runningQNum += flatQs.length;
    return {
      ...sec,
      questions: flatQs
    };
  });

  return processedSections;
}

export function countTotalQuestions(questionsListOrSections: any[]): number {
  if (!Array.isArray(questionsListOrSections)) return 0;
  
  if (questionsListOrSections.some(item => item && Array.isArray(item.questions))) {
    let total = 0;
    questionsListOrSections.forEach(sec => {
      if (sec && Array.isArray(sec.questions)) {
        total += flattenQuestionsToIndividual(sec.questions).length;
      }
    });
    return total;
  }

  return flattenQuestionsToIndividual(questionsListOrSections).length;
}
