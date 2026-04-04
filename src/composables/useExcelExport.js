import * as XLSX from "xlsx";

export function useExcelExport() {
  const styleHeader = (ws, headerRow) => {
    headerRow.forEach((_, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
      if (!ws[cellRef]) return;
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "6366F1" } },
        alignment: { horizontal: "center" },
      };
    });
  };

  // SCHOOL PSYCHOLOGIST: Full school report
  const exportSchoolReport = (schoolName, data) => {
    const wb = XLSX.utils.book_new();
    const date = new Date().toLocaleDateString("uz-UZ");

    // Sheet 1: Umumiy ko'rsatkichlar
    const summary = [
      ["Ko'rsatkich", "Qiymat"],
      ["Maktab nomi", schoolName],
      ["Hisobot sanasi", date],
      ["", ""],
      ["Jami o'quvchilar", data.totalStudents],
      ["Test topshirganlar", data.testedStudents],
      ["Test topshirmaganlar", data.notTested],
      ["Topshirish foizi", data.completionRate + "%"],
      ["O'rtacha stress", data.avgStress + "%"],
      ["Yuqori risk (>60%)", data.highRisk],
      ["O'rta risk (30-60%)", data.mediumRisk],
      ["Past risk (<30%)", data.lowRisk],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summary);
    ws1["!cols"] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Umumiy");

    // Sheet 2: Sinflar tahlili (KEY SHEET)
    if (data.classes?.length) {
      const classHeaders = [
        "Sinf",
        "Jami o'quvchilar",
        "Test topshirdi",
        "Topshirmadi",
        "Topshirish kerak (qoldi)",
        "Topshirish foizi %",
        "O'rtacha stress %",
        "Yuqori risk",
        "O'rta risk",
        "Past risk",
        "Holat",
      ];

      const classRows = data.classes.map((c) => [
        c.class_name,
        c.total_students,
        c.tested_students,
        c.not_tested,
        c.remaining_to_test,
        c.completion_pct + "%",
        c.avg_stress || "—",
        c.high_risk || 0,
        c.medium_risk || 0,
        c.low_risk || 0,
        c.completion_pct >= 90
          ? "✅ Yaxshi"
          : c.completion_pct >= 50
            ? "⚠ O'rta"
            : "❌ Past",
      ]);

      const ws2 = XLSX.utils.aoa_to_sheet([classHeaders, ...classRows]);
      ws2["!cols"] = classHeaders.map(() => ({ wch: 22 }));
      styleHeader(ws2, classHeaders);
      XLSX.utils.book_append_sheet(wb, ws2, "Sinflar tahlili");
    }

    // Sheet 3: Barcha o'quvchilar
    if (data.students?.length) {
      const headers = [
        "№",
        "Student ID",
        "Ism Familiya",
        "Yosh",
        "Sinf",
        "Maktab",
        "Testlar soni",
        "O'rtacha stress %",
        "Oxirgi test",
        "Portret turi",
        "Risk darajasi",
        "Holat",
      ];

      const rows = data.students.map((s, i) => [
        i + 1,
        s.student_code,
        s.full_name,
        s.age,
        s.class_name,
        s.school_name,
        s.tests_taken || 0,
        s.avg_stress || "Test topshirmagan",
        s.last_test_date
          ? new Date(s.last_test_date).toLocaleDateString("uz-UZ")
          : "—",
        s.personality_types || "—",
        s.risk_level === "high"
          ? "Yuqori"
          : s.risk_level === "medium"
            ? "O'rta"
            : s.risk_level === "low"
              ? "Past"
              : "Test yo'q",
        s.risk_level === "high"
          ? "🔴 Diqqat!"
          : s.risk_level === "medium"
            ? "🟡 Kuzatuv"
            : s.risk_level === "low"
              ? "🟢 Normal"
              : "—",
      ]);

      const ws3 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws3["!cols"] = headers.map(() => ({ wch: 20 }));
      styleHeader(ws3, headers);
      XLSX.utils.book_append_sheet(wb, ws3, "Barcha o'quvchilar");
    }

    // Sheet 4: Yuqori risk o'quvchilar
    if (data.highRiskStudents?.length) {
      const headers = [
        "№",
        "Ism Familiya",
        "Sinf",
        "Stress %",
        "Oxirgi test sanasi",
        "Ota-ona telefoni",
        "Izoh",
      ];

      const rows = data.highRiskStudents.map((s, i) => [
        i + 1,
        s.full_name,
        s.class_name,
        s.avg_stress,
        s.last_test_date
          ? new Date(s.last_test_date).toLocaleDateString("uz-UZ")
          : "—",
        s.parent_phone || "Kiritilmagan",
        "Psixolog bilan suhbat zarur",
      ]);

      const ws4 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws4["!cols"] = headers.map(() => ({ wch: 22 }));
      styleHeader(ws4, headers);
      XLSX.utils.book_append_sheet(wb, ws4, "Yuqori risk");
    }

    // Sheet 5: Test natijalari tarixi
    if (data.testHistory?.length) {
      const headers = [
        "№",
        "Ism Familiya",
        "Sinf",
        "Test nomi",
        "Ball",
        "Risk",
        "Test turi",
        "Sana",
      ];

      const rows = data.testHistory.map((t, i) => [
        i + 1,
        t.full_name,
        t.class_name,
        t.test_title,
        t.total_score,
        t.result_label,
        t.test_type,
        new Date(t.completed_at).toLocaleDateString("uz-UZ"),
      ]);

      const ws5 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws5["!cols"] = headers.map(() => ({ wch: 20 }));
      styleHeader(ws5, headers);
      XLSX.utils.book_append_sheet(wb, ws5, "Test tarixi");
    }

    const safeName = schoolName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${safeName}_Hisobot_${fileDate}.xlsx`);
  };

  // ADMIN: Full platform report
  const exportAdminReport = (data) => {
    const wb = XLSX.utils.book_new();
    const date = new Date().toLocaleDateString("uz-UZ");

    // Sheet 1: Platform umumiy
    const summary = [
      ["StressTest — Admin Hisoboti"],
      ["Sana: " + date],
      [""],
      ["Ko'rsatkich", "Qiymat"],
      ["Jami maktablar", data.totalSchools],
      ["Jami o'quvchilar", data.totalStudents],
      ["Jami testlar", data.totalTests],
      ["O'rtacha stress", data.avgStress + "%"],
      ["Yuqori risk o'quvchilar", data.totalHighRisk],
      ["Bugun testlar", data.todayTests],
      ["Bu hafta yangi o'quvchilar", data.weeklyNew],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summary);
    ws1["!cols"] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Umumiy");

    // Sheet 2: Maktablar solishtirmasi
    if (data.schools?.length) {
      const headers = [
        "№",
        "Maktab nomi",
        "Maktab kodi",
        "Jami o'quvchilar",
        "Test topshirdi",
        "Topshirmadi",
        "Topshirish %",
        "O'rtacha stress %",
        "Yuqori risk",
        "So'nggi faollik",
        "Reyting",
      ];

      const rows = data.schools
        .sort((a, b) => b.completion_rate - a.completion_rate)
        .map((s, i) => [
          i + 1,
          s.school_name,
          s.school_code,
          s.total_students,
          s.tested_students,
          s.not_tested_students,
          s.completion_rate + "%",
          s.avg_stress || "—",
          s.high_risk_count || 0,
          s.last_activity
            ? new Date(s.last_activity).toLocaleDateString("uz-UZ")
            : "—",
          i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1 + "-o'rin",
        ]);

      const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws2["!cols"] = headers.map(() => ({ wch: 22 }));
      styleHeader(ws2, headers);
      XLSX.utils.book_append_sheet(wb, ws2, "Maktablar solishtirmasi");
    }

    // Sheet 3: Barcha o'quvchilar
    if (data.allStudents?.length) {
      const headers = [
        "№",
        "Student ID",
        "Ism",
        "Yosh",
        "Sinf",
        "Maktab",
        "Testlar",
        "Stress %",
        "Risk",
        "Ro'yxat sanasi",
      ];

      const rows = data.allStudents.map((s, i) => [
        i + 1,
        s.student_code,
        s.full_name,
        s.age,
        s.class_name,
        s.school_name,
        s.tests_taken || 0,
        s.avg_stress || "—",
        s.risk_level === "high"
          ? "Yuqori"
          : s.risk_level === "medium"
            ? "O'rta"
            : s.risk_level === "low"
              ? "Past"
              : "Test yo'q",
        new Date(s.created_at).toLocaleDateString("uz-UZ"),
      ]);

      const ws3 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws3["!cols"] = headers.map(() => ({ wch: 20 }));
      styleHeader(ws3, headers);
      XLSX.utils.book_append_sheet(wb, ws3, "Barcha o'quvchilar");
    }

    // Sheet 4: Kunlik faollik (30 kun)
    if (data.dailyActivity?.length) {
      const headers = [
        "Sana",
        "Testlar",
        "Noyob o'quvchilar",
        "O'rtacha stress",
      ];

      const rows = data.dailyActivity.map((d) => [
        d.day,
        d.tests_done,
        d.unique_students,
        d.avg_stress || "—",
      ]);

      const ws4 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws4["!cols"] = headers.map(() => ({ wch: 22 }));
      styleHeader(ws4, headers);
      XLSX.utils.book_append_sheet(wb, ws4, "Kunlik faollik");
    }

    const fileDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `StressTest_Admin_${fileDate}.xlsx`);
  };

  return { exportSchoolReport, exportAdminReport };
}

