export const ROMAN_TO_NUM: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5,
  vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15,
  xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20
};

export const NUM_TO_ROMAN: Record<number, string> = {
  1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v",
  6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x",
  11: "xi", 12: "xii", 13: "xiii", 14: "xiv", 15: "xv",
  16: "xvi", 17: "xvii", 18: "xviii", 19: "xix", 20: "xx"
};

export function parseRomanNumeral(str: string): number | null {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase().replace(/^[\(\[\{]/, "").replace(/[\)\]\}\.:]$/, "").trim();
  if (ROMAN_TO_NUM[cleaned] !== undefined) {
    return ROMAN_TO_NUM[cleaned];
  }
  return null;
}

export function stripParagraphPrefix(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .replace(/^(paragraph|para|section|part|passage|option)\s+/i, "")
    .trim();
}

export function parseMultiPromptAnswers(raw: string | string[] | any, expectedCount: number = 0): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(s => String(s || "").trim()).filter(Boolean);
  }
  const str = String(raw || "").trim();
  if (!str) return [];

  // Try newline first
  if (str.includes("\n")) {
    const lines = str.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length > 1 || expectedCount <= 1) return lines;
  }
  // Try pipe
  if (str.includes("|")) {
    const items = str.split("|").map(s => s.trim()).filter(Boolean);
    if (items.length > 1) return items;
  }
  // Try semicolon
  if (str.includes(";")) {
    const items = str.split(";").map(s => s.trim()).filter(Boolean);
    if (items.length > 1) return items;
  }
  // Try comma
  if (str.includes(",")) {
    const items = str.split(",").map(s => s.trim()).filter(Boolean);
    if (items.length > 1) {
      if (!expectedCount || items.length === expectedCount || items.length > 1) {
        return items;
      }
    }
  }
  // Try slash if item count matches expected count
  if (expectedCount > 1 && str.includes("/")) {
    const items = str.split("/").map(s => s.trim()).filter(Boolean);
    if (items.length === expectedCount) return items;
  }

  return [str];
}

export function getCanonicalTokens(val: any, options?: any[]): Set<string> {
  const tokens = new Set<string>();
  if (val === undefined || val === null) return tokens;

  if (typeof val === "number") {
    tokens.add(String(val));
    tokens.add(`idx:${val}`);
    tokens.add(String(val + 1));
    const r = NUM_TO_ROMAN[val + 1];
    if (r) tokens.add(`roman:${r}`);
    if (val >= 0 && val < 26) {
      tokens.add(`letter:${String.fromCharCode(97 + val)}`);
    }
    if (options && options[val] !== undefined) {
      const optStr = String(options[val]).trim().toLowerCase();
      tokens.add(optStr);
      tokens.add(optStr.replace(/[^a-z0-9]/g, ""));
    }
    return tokens;
  }

  const raw = String(val).trim();
  if (!raw) return tokens;

  const lower = raw.toLowerCase();
  tokens.add(lower);

  const clean = lower.replace(/[^a-z0-9]/g, "");
  if (clean) tokens.add(clean);

  // Strip Paragraph / Para / Section / Part / Option prefix
  const strippedPara = stripParagraphPrefix(lower);
  if (strippedPara) {
    tokens.add(strippedPara);
    tokens.add(strippedPara.replace(/[^a-z0-9]/g, ""));
  }

  // Check if it's a single letter A-Z
  const singleLetterMatch = strippedPara.match(/^([a-z])$/i);
  if (singleLetterMatch) {
    const l = singleLetterMatch[1].toLowerCase();
    const lIdx = l.charCodeAt(0) - 97;
    tokens.add(`letter:${l}`);
    tokens.add(`idx:${lIdx}`);
    tokens.add(String(lIdx + 1));
    const r = NUM_TO_ROMAN[lIdx + 1];
    if (r) tokens.add(`roman:${r}`);
  }

  // Check if it's a Roman numeral
  const rNum = parseRomanNumeral(strippedPara);
  if (rNum !== null) {
    tokens.add(`roman:${NUM_TO_ROMAN[rNum]}`);
    tokens.add(String(rNum));
    tokens.add(`idx:${rNum - 1}`);
    if (rNum >= 1 && rNum <= 26) {
      tokens.add(`letter:${String.fromCharCode(96 + rNum)}`);
    }
  }

  // Check if it's a standalone digit
  if (/^\d+$/.test(strippedPara)) {
    const n = parseInt(strippedPara, 10);
    tokens.add(String(n));
    tokens.add(`idx:${n - 1}`);
    const r = NUM_TO_ROMAN[n];
    if (r) tokens.add(`roman:${r}`);
    if (n >= 1 && n <= 26) {
      tokens.add(`letter:${String.fromCharCode(96 + n)}`);
    }
  }

  // Check for leading label like "iv. The origin of speech" or "B. Technological advances" or "4. Early navigation"
  const headingMatch = lower.match(/^([a-z0-9]+)[\.\:\)\s\-]+(.+)$/i);
  if (headingMatch) {
    const prefix = headingMatch[1].trim();
    const content = headingMatch[2].trim();
    tokens.add(prefix);
    tokens.add(content);
    tokens.add(content.replace(/[^a-z0-9]/g, ""));

    const prefixRNum = parseRomanNumeral(prefix);
    if (prefixRNum !== null) {
      tokens.add(`roman:${NUM_TO_ROMAN[prefixRNum]}`);
      tokens.add(String(prefixRNum));
      tokens.add(`idx:${prefixRNum - 1}`);
      if (prefixRNum >= 1 && prefixRNum <= 26) {
        tokens.add(`letter:${String.fromCharCode(96 + prefixRNum)}`);
      }
    }
    if (/^[a-z]$/i.test(prefix)) {
      const pl = prefix.toLowerCase();
      const plIdx = pl.charCodeAt(0) - 97;
      tokens.add(`letter:${pl}`);
      tokens.add(`idx:${plIdx}`);
      tokens.add(String(plIdx + 1));
      const r = NUM_TO_ROMAN[plIdx + 1];
      if (r) tokens.add(`roman:${r}`);
    }
    if (/^\d+$/.test(prefix)) {
      const pn = parseInt(prefix, 10);
      tokens.add(String(pn));
      tokens.add(`idx:${pn - 1}`);
      const r = NUM_TO_ROMAN[pn];
      if (r) tokens.add(`roman:${r}`);
      if (pn >= 1 && pn <= 26) {
        tokens.add(`letter:${String.fromCharCode(96 + pn)}`);
      }
    }
  }

  // Correlate with options array if provided
  if (Array.isArray(options) && options.length > 0) {
    options.forEach((opt, optIdx) => {
      const oStr = String(opt).trim().toLowerCase();
      const oClean = oStr.replace(/[^a-z0-9]/g, "");
      let matchesOpt = (oStr === lower || oClean === clean);
      if (!matchesOpt && headingMatch) {
        const oContent = oStr.replace(/^[a-z0-9]+[\.\:\)\s\-]+/i, "").trim();
        if (oContent && (oContent === headingMatch[2].trim() || oContent.replace(/[^a-z0-9]/g, "") === headingMatch[2].replace(/[^a-z0-9]/g, ""))) {
          matchesOpt = true;
        }
      }
      if (matchesOpt) {
        tokens.add(`idx:${optIdx}`);
        tokens.add(String(optIdx + 1));
        const r = NUM_TO_ROMAN[optIdx + 1];
        if (r) tokens.add(`roman:${r}`);
        if (optIdx >= 0 && optIdx < 26) {
          tokens.add(`letter:${String.fromCharCode(97 + optIdx)}`);
        }
      }
    });
  }

  return tokens;
}

export function isAnswerMatch(studentAns: any, correctAns: any, options?: any[]): boolean {
  if (studentAns === undefined || studentAns === null || correctAns === undefined || correctAns === null) {
    return false;
  }
  const sStr = String(studentAns).trim();
  const cStr = String(correctAns).trim();
  if (!sStr || !cStr) return false;

  // Direct case-insensitive match
  if (sStr.toLowerCase() === cStr.toLowerCase()) return true;

  // If correctAns has comma or slash alternatives: e.g. "iv, 4" or "iv / 4" or "Paragraph A / A"
  const alternatives = cStr.split(/[\/,|]/).map(x => x.trim()).filter(Boolean);
  if (alternatives.length > 1) {
    if (alternatives.some(alt => isAnswerMatch(studentAns, alt, options))) {
      return true;
    }
  }

  // Get tokens for both
  const sTokens = getCanonicalTokens(studentAns, options);
  const cTokens = getCanonicalTokens(correctAns, options);

  // Check token intersection
  for (const token of sTokens) {
    if (cTokens.has(token)) {
      return true;
    }
  }

  // Substring matching for full heading vs prefix
  const sClean = sStr.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cClean = cStr.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (sClean && cClean && (sClean === cClean || sClean.includes(cClean) || cClean.includes(sClean))) {
    if (Math.min(sClean.length, cClean.length) >= 4) {
      return true;
    }
  }

  return false;
}

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
    : (Array.isArray(q.data?.options) && q.data.options.length > 0 ? q.data.options : defaultTfOpts);

  const rawLower = rawAns.toLowerCase();
  const rawUpper = rawAns.toUpperCase();

  // Exact match against options array
  const exactIdx = options.findIndex((opt: any) => String(opt).toLowerCase().trim() === rawLower);
  if (exactIdx !== -1) return exactIdx;

  // Match option stripped of prefix vs raw stripped of prefix
  const rawStripped = rawLower.replace(/^(paragraph|para|section|part|passage|option)\s+/i, "").trim();
  const strippedIdx = options.findIndex((opt: any) => {
    const oStr = String(opt).toLowerCase().trim();
    const oStripped = oStr.replace(/^(paragraph|para|section|part|passage|option)\s+/i, "").trim();
    return oStripped === rawStripped;
  });
  if (strippedIdx !== -1) return strippedIdx;

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

  // Roman numerals check (e.g. "i", "ii", "iv", "v", "ix", etc. or "iv. The heading")
  const rNum = parseRomanNumeral(rawStripped);
  if (rNum !== null) {
    const targetIdx = rNum - 1;
    const optRomanIdx = options.findIndex((opt: any) => {
      const oLower = String(opt).toLowerCase().trim();
      const oRoman = parseRomanNumeral(oLower);
      if (oRoman === rNum) return true;
      const m = oLower.match(/^([a-z]+)[\.\:\)\s]/);
      if (m && parseRomanNumeral(m[1]) === rNum) return true;
      return false;
    });
    if (optRomanIdx !== -1) return optRomanIdx;
    if (targetIdx >= 0 && targetIdx < options.length) return targetIdx;
    return targetIdx;
  }

  // Letter choices A through Z ("A", "B", "C", ... "H", "Option A", "A.", "A)", "Paragraph A")
  const letterMatch = rawStripped.match(/^([a-z])([\.\:\)\s]|$)/i);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const lIdx = letter.charCodeAt(0) - 65;
    const optLetterIdx = options.findIndex((opt: any, idx: number) => {
      const oStr = String(opt).trim().toUpperCase();
      const oStripped = oStr.replace(/^(PARAGRAPH|PARA|SECTION|PART|PASSAGE|OPTION)\s+/i, "").trim();
      if (oStripped.startsWith(letter + ".") || oStripped.startsWith(letter + ":") || oStripped.startsWith(letter + ")") || oStripped === letter) {
        return true;
      }
      return idx === lIdx;
    });
    if (optLetterIdx !== -1) return optLetterIdx;
    if (lIdx >= 0 && lIdx < options.length) return lIdx;
    return lIdx;
  }

  // Digit string ("0", "1", "2", "3")
  if (/^\d+$/.test(rawStripped)) {
    const num = parseInt(rawStripped, 10);
    if (num >= 0 && num < options.length) {
      return num;
    }
    if (num >= 1 && num <= options.length) {
      return num - 1;
    }
  }

  // Partial string match against option texts
  const partialIdx = options.findIndex((opt: any) => {
    const oStr = String(opt).toLowerCase().trim();
    const aStr = rawLower;
    const oClean = oStr.replace(/^(option\s+[a-z][:\s]*|[a-z][.\)\:\s]+|[0-9]+[.\)\:\s]+)/i, "").trim();
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

      const rawAnsStr = String(q.correctAnswer ?? q.data?.correctAnswer ?? q.answer ?? q.data?.answer ?? "");

      if (Array.isArray(paragraphs) && paragraphs.length > 0) {
        const paragraphAnswers = parseMultiPromptAnswers(rawAnsStr, paragraphs.length);
        paragraphs.forEach((p: any, pIdx: number) => {
          const itemQNum = p.qNum !== undefined ? p.qNum : startNum + pIdx;
          const itemAns = p.answer || p.correctAnswer || paragraphAnswers[pIdx] || "";
          result.push({
            id: p.id || `${q.id || "match"}_p_${pIdx}_${itemQNum}`,
            type: "MATCHING",
            qNum: itemQNum,
            _origQNum: itemQNum,
            text: p.text || p.name || p.paragraph || `Paragraph ${String.fromCharCode(65 + pIdx)}`,
            options: optionsList,
            passageText: optionsList.join("\n"),
            correctAnswer: itemAns,
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
      const promptAnswersList = parseMultiPromptAnswers(rawAnsStr, promptsList.length);

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
            correctAnswer: promptAnswersList[pIdx] || promptAnswersList[0] || "",
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
