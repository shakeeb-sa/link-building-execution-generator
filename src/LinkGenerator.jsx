import React, { useState, useRef } from 'react';
import XLSX from 'xlsx-js-style';

const PRIORITY_ORDER = [
  "guest blogging",
  "pr marketing",
  "listicles",
  "video submission",
  "infographic",
  "web 2.0",
  "da 50+",
  "niche group discussion",
  "business profiles",
  ".edu",
  "classifieds marketing",
  "community discussion",
];

const LinkGenerator = () => {
  const [status, setStatus] = useState({ msg: "Waiting for file...", type: "waiting" });
  const [showDownload, setShowDownload] = useState(false);
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState(null); // New state for summary stats
  
  const workbookDataRef = useRef(null);
  const executionDataRef = useRef([]);

  // --- LOGIC FUNCTIONS ---
  const normalizeActivity = (name) => {
    const lower = String(name).toLowerCase().trim();
    if (lower.includes("profiles") || lower.includes("citation") || lower.includes("business profile")) return "business profiles";
    if (lower.includes("article marketing")) return "guest blogging";
    if (lower.includes("web 2.0") || lower.includes("web 2.o") || lower.includes("social web")) return "web 2.0";
    if (lower.includes("press release") || lower.includes("pr marketing") || lower === "pr" || lower.includes("pr ")) return "pr marketing";
    if (lower.includes("high da") || lower.includes("da 50")) return "da 50+";
    if (lower.includes("edu") || lower.includes("gov")) return ".edu";
    if (lower.includes("targeted") || lower.includes("classified")) return "classifieds marketing";
    if (lower.includes("video")) return "video submission";
    if (lower.includes("info") || lower.includes("infographic")) return "infographic";
    if (lower.includes("listicle")) return "listicles";
    if (lower.includes("niche group")) return "niche group discussion";
    if (lower.includes("community")) return "community discussion";
    return lower;
  };

  const toTitleCase = (str) => {
    if (!str) return "";
    return String(str).toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const extractUrlDescriptions = (workbook) => {
    const map = {};
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      for (let r = 0; r < rows.length - 1; r++) {
        const row = rows[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          const cellVal = String(row[c] || "").trim();
          if (cellVal.toLowerCase().startsWith("http")) {
            const nextRow = rows[r + 1];
            if (nextRow) {
              const descVal = String(nextRow[c] || "").trim();
              if (descVal && !descVal.toLowerCase().startsWith("http")) {
                map[cellVal.toLowerCase()] = descVal;
              }
            }
          }
        }
      }
    });
    return map;
  };

  const formatDescriptionWithLink = (description, keyword, url) => {
    if (!description) return "";
    const kwClean = String(keyword).trim();
    const urlClean = String(url).trim();
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapeRegExp(kwClean), "i");

    if (regex.test(description)) {
      return description.replace(regex, (match) => `<a href="${urlClean}">${match}</a>`);
    } else {
      const semiColonIndex = description.indexOf(";");
      const linkHtml = ` | <a href="${urlClean}">${toTitleCase(kwClean)}</a>`;
      if (semiColonIndex !== -1) {
        const part1 = description.substring(0, semiColonIndex).trim();
        const part2 = description.substring(semiColonIndex);
        return `${part1}${linkHtml}${part2}`;
      } else {
        return `${description}${linkHtml}`;
      }
    }
  };

  const formatDescriptionForCommunity = (description, url) => {
    if (!description) return "";
    const urlClean = String(url).trim();
    const semiColonIndex = description.indexOf(";");
    if (semiColonIndex !== -1) {
      const title = description.substring(0, semiColonIndex).trim();
      const body = description.substring(semiColonIndex);
      return `<a href="${urlClean}">${title}</a>${body}`;
    } else {
      return `<a href="${urlClean}">${description}</a>`;
    }
  };

  // --- NEW FEATURE: Sample Template Generator ---
  const downloadSampleTemplate = () => {
    const headers = [
      ["Keyword", "Target URL", "Guest Blogging", "Web 2.0", "PR Marketing", "Profiles", "Description Reference (Optional)"]
    ];
    const sampleData = [
      ["best seo tools", "https://mysite.com/tools", 2, 5, 0, 0, ""],
      ["link building", "https://mysite.com/blog", 1, 0, 1, 10, ""],
      ["", "https://mysite.com/tools", "", "", "", "", "This is a great tool for SEOs; check it out."]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning Sheet");
    XLSX.writeFile(wb, "Link_Executor_Sample_Template.xlsx");
  };

  const processPlan = (data, originalWorkbook) => {
    let tempRows = [];
    const urlDescMap = extractUrlDescriptions(originalWorkbook);
    let headerRowIndex = -1;
    let keywordColIndex = -1;
    let urlColIndex = -1;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c]).toLowerCase().trim();
        if (cell.includes("keyword")) { headerRowIndex = r; keywordColIndex = c; }
        if (cell.includes("url")) { urlColIndex = c; }
      }
      if (headerRowIndex !== -1 && urlColIndex !== -1) break;
    }

    if (headerRowIndex === -1) {
      setStatus({ msg: "Error: 'Keyword' or 'URL' column not found in Excel.", type: "error" });
      return;
    }

    const activityMap = {};
    const headerRow = data[headerRowIndex];
    const topRow = data[0];

    for (let c = 0; c < headerRow.length; c++) {
      if (c !== keywordColIndex && c !== urlColIndex) {
        let rawName = (topRow[c] || headerRow[c] || "").toString().trim();
        if (rawName && isNaN(rawName)) {
          activityMap[c] = normalizeActivity(rawName);
        }
      }
    }

    // Tracking stats
    const currentStats = {};

    for (let r = headerRowIndex + 1; r < data.length; r++) {
      const row = data[r];
      const keyword = row[keywordColIndex];
      const url = row[urlColIndex];
      if (!keyword) continue;
      let rawDescription = url ? urlDescMap[String(url).toLowerCase().trim()] || "" : "";

      for (let colIndex in activityMap) {
        const count = parseInt(row[colIndex]);
        const activityStandard = activityMap[colIndex];
        
        if (!isNaN(count) && count > 0) {
          // Update Stats
          const niceName = toTitleCase(activityStandard);
          currentStats[niceName] = (currentStats[niceName] || 0) + count;

          let finalDescription = rawDescription;
          if (["guest blogging", "pr marketing", "web 2.0", "da 50+", ".edu", "listicles", "niche group discussion"].includes(activityStandard)) {
            finalDescription = formatDescriptionWithLink(rawDescription, keyword, url);
          } else if (activityStandard === "classifieds marketing") {
            let desc = formatDescriptionWithLink(rawDescription, keyword, url);
            const footer = `<br><br>Please visit our website: ${url}<br><br>Keywords: ${toTitleCase(keyword)}`;
            finalDescription = desc + footer;
          } else if (activityStandard === "community discussion") {
            finalDescription = formatDescriptionForCommunity(rawDescription, url);
          } else {
            if (!finalDescription) finalDescription = "";
          }

          for (let i = 0; i < count; i++) {
            tempRows.push({
              Activity: toTitleCase(activityStandard),
              "Target URL (Reference)": url,
              Description: finalDescription,
              "Website (Backlink)": "",
              "Link Type": "Keyword",
              "Keyword Promoted": keyword,
              DA: "",
              PA: "",
              "Moz Rank": "",
              SS: "",
            });
          }
        }
      }
    }

    tempRows.sort((a, b) => {
      const actA = a["Activity"].toLowerCase().trim();
      const actB = b["Activity"].toLowerCase().trim();
      let indexA = PRIORITY_ORDER.indexOf(actA);
      let indexB = PRIORITY_ORDER.indexOf(actB);
      if (indexA === -1) indexA = 999;
      if (indexB === -1) indexB = 999;
      return indexA - indexB;
    });

    const finalData = tempRows.map((row, index) => {
      return { "S.No": index + 1, ...row };
    });

    executionDataRef.current = finalData;
    workbookDataRef.current = originalWorkbook;

    if (finalData.length === 0) {
      setStatus({ msg: "Processed file, but no rows were generated.", type: "error" });
      setStats(null);
    } else {
      setStatus({ msg: "Processing Complete.", type: "success" });
      setStats(currentStats);
      setShowDownload(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus({ msg: "Processing...", type: "waiting" });
    setShowDownload(false);
    setStats(null);

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {
        type: "array",
        cellStyles: true,
        cellFormula: true,
        cellNF: true,
        sheetStubs: true,
      });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (rawData.length === 0) {
        setStatus({ msg: "The Excel file seems empty.", type: "error" });
        return;
      }
      processPlan(rawData, workbook);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadFile = () => {
    const newWb = workbookDataRef.current;
    const formattedData = executionDataRef.current.map((row) => {
      return { ...row, "Keyword Promoted": toTitleCase(row["Keyword Promoted"]) };
    });

    const executionWs = XLSX.utils.json_to_sheet(formattedData, { origin: "A2" });
    executionWs["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
    const wscols = [{ wch: 6 }, { wch: 25 }, { wch: 40 }, { wch: 45 }, { wch: 50 }, { wch: 15 }, { wch: 40 }, { wch: 5 }, { wch: 5 }, { wch: 10 }, { wch: 5 }];
    executionWs["!cols"] = wscols;

    const rowHeights = [];
    rowHeights.push({ hpx: 123.75 });
    rowHeights.push({ hpx: 35 });
    for (let i = 0; i < formattedData.length; i++) {
      rowHeights.push({ hpx: 35 });
    }
    executionWs["!rows"] = rowHeights;

    const range = XLSX.utils.decode_range(executionWs["!ref"]);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C });
      if (!executionWs[cellAddress]) continue;
      executionWs[cellAddress].s = {
        fill: { fgColor: { rgb: "1F4E78" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
        alignment: { vertical: "center", horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FFFFFF" } },
          bottom: { style: "thin", color: { rgb: "FFFFFF" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } },
        },
      };
    }

    for (let R = 2; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!executionWs[cellAddress]) continue;
        if (!executionWs[cellAddress].s) executionWs[cellAddress].s = {};
        executionWs[cellAddress].s.alignment = { vertical: "center" };
        executionWs[cellAddress].s.font = { sz: 11 };
        if (C === 3) executionWs[cellAddress].s.alignment.wrapText = true;
        if ([0, 1, 5, 6, 7, 8, 9, 10].includes(C)) executionWs[cellAddress].s.alignment.horizontal = "center";
        else executionWs[cellAddress].s.alignment.horizontal = "left";
      }
    }

    if (newWb.Sheets["Execution List"]) {
      newWb.Sheets["Execution List"] = executionWs;
    } else {
      XLSX.utils.book_append_sheet(newWb, executionWs, "Execution List");
    }

    XLSX.writeFile(newWb, "Link_Building_Execution_Plan.xlsx", { cellStyles: true });
  };

  return (
    <div className="tool-card">
      <div className="tool-header">
        <h1>Link Execution Generator</h1>
        <p>Transform raw outreach plans into prioritized execution lists instantly.</p>
        
        {/* NEW: Sample Template Button */}
        <div style={{marginTop: '1rem'}}>
           <button onClick={downloadSampleTemplate} className="btn-text">
             Don't have a file? Download Sample Template
           </button>
        </div>
      </div>

      <div className="info-panel">
        <span className="info-title">Automatic Sorting Priority:</span>
        1. Guest Blogging &rarr; 2. Press Release &rarr; 3. Listicles &rarr; 4. Video &rarr; 5. Infographic &rarr; 
        6. Web 2.0 &rarr; 7. DA 50+ &rarr; 8. Niche Group &rarr; 9. Profiles &rarr; 10. Edu
      </div>

      <div className="upload-area">
        <span className="upload-icon">📂</span>
        <span className="upload-text">{fileName ? fileName : "Click or Drag Excel File Here"}</span>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange} 
          className="file-input"
        />
      </div>

      {status.msg && status.msg !== "Waiting for file..." && (
        <div className={`status-msg status-${status.type}`}>
          {status.msg}
        </div>
      )}

      {/* NEW: Statistics Grid */}
      {stats && (
        <div className="stats-grid">
           <h3>Execution Summary:</h3>
           <div className="tags-container">
             {Object.entries(stats).map(([key, value]) => (
                <span key={key} className="stat-tag">
                   {key}: <b>{value}</b>
                </span>
             ))}
           </div>
        </div>
      )}

      {showDownload && (
        <button className="btn-action" onClick={downloadFile}>
          Download Sorted Template
        </button>
      )}
    </div>
  );
};

export default LinkGenerator;