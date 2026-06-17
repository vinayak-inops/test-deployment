"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import InOpsDeployment from "@/components/deployment-dashboard";

export default function Home() {
  const navItems = ["solutions", "modules", "industries", "deploymentConsole", "calculator"] as const;
  const [activeView, setActiveView] = useState<"home" | "calculator" | "deployment">("home");
  const [pageLanguage, setPageLanguage] = useState<"en" | "zh">("en");
  const [calcState, setCalcState] = useState({
    totalContractors: 1000,
    avgMonthlyCostPerContractor: 15000,
    ghostWorkerPercentage: 5,
    buddyPunchingPercentage: 3,
    overtimeInflationPercentage: 8,
    invoiceOverbillingPercentage: 4,
    headcountMismatchPercentage: 2,
    pfEsiMismatchPercentage: 6,
    wrongClassificationPercentage: 3,
    backgroundCheckFailures: 2,
    productivityLossDays: 5,
  });

  const calculatorTranslations = {
    en: {
      pageTitle: "Contract Labor Loss Calculator",
      pageSubtitle: "Calculate hidden costs of contract workforce governance gaps",
      language: "Language",
      workforceDetails: "Your Workforce Details",
      totalContractWorkers: "Total Contract Workers",
      avgMonthlyCostPerContractor: "Average Monthly Cost per Contractor (Rs)",
      totalAnnualLoss: "Total Annual Loss",
      annualContractorSpend: "Annual Contractor Spend",
      annualSpendSuffix: "of annual contractor spend",
      lossBreakdown: "Loss Breakdown",
      roiInsight: "ROI Insight with IDDION Platform",
      platformCost: "Platform Cost",
      potentialSavings: "Potential Savings",
      firstYearRoiPrefix: "That is a",
      firstYearRoiSuffix: "in the first year",
      perYearSuffix: "/year",
      sliders: {
        ghostWorkerPercentage: "Ghost Workers",
        buddyPunchingPercentage: "Buddy Punching/Time Theft",
        overtimeInflationPercentage: "Overtime Inflation",
        invoiceOverbillingPercentage: "Invoice Overbilling",
        headcountMismatchPercentage: "Headcount Mismatch",
        pfEsiMismatchPercentage: "PF/ESI Mismatch",
        wrongClassificationPercentage: "Wrong Classification Risk",
        backgroundCheckFailures: "Background Check Failures",
        productivityLossDays: "Productivity Loss (Days/Year)",
      },
      losses: {
        ghostWorkers: "Ghost Workers",
        buddyPunching: "Buddy Punching/Time Theft",
        overtime: "Overtime Inflation",
        overbilling: "Invoice Overbilling",
        headcountMismatch: "Headcount Mismatch",
        pfEsiPenalties: "PF/ESI Penalties",
        classificationRisk: "Classification Risk",
        backgroundCheckFailures: "Background Check Failures",
        productivityLoss: "Productivity Loss",
        adminOverhead: "Administrative Overhead",
      },
      details: {
        ghostWorkers: (count: number) => `${Math.round(count)} ghost workers`,
        buddyPunching: (count: number) => `${Math.round(count)} workers affected`,
        overtime: "Inflated OT claims",
        overbilling: "Vendor discrepancies",
        headcountMismatch: "Workers not present",
        pfEsiPenalties: "Non-compliance penalties",
        classificationRisk: "Back-tax risk",
        backgroundCheckFailures: (count: number) => `${Math.round(count)} incidents`,
        productivityLoss: "Workforce inefficiency",
        adminOverhead: "Manual processing",
      },
    },
    zh: {
      pageTitle: "合同劳务损失计算器",
      pageSubtitle: "计算合同劳务管理漏洞带来的隐性成本",
      language: "语言",
      workforceDetails: "您的劳动力信息",
      totalContractWorkers: "合同工总人数",
      avgMonthlyCostPerContractor: "每位合同工月均成本（Rs）",
      totalAnnualLoss: "年度总损失",
      annualContractorSpend: "年度合同工总支出",
      annualSpendSuffix: "占年度合同工支出的比例",
      lossBreakdown: "损失明细",
      roiInsight: "使用 IDDION 平台的 ROI 洞察",
      platformCost: "平台成本",
      potentialSavings: "潜在节省",
      firstYearRoiPrefix: "首年可实现",
      firstYearRoiSuffix: "投资回报",
      perYearSuffix: "/年",
      sliders: {
        ghostWorkerPercentage: "幽灵员工",
        buddyPunchingPercentage: "代打卡/工时盗用",
        overtimeInflationPercentage: "加班虚增",
        invoiceOverbillingPercentage: "发票超额计费",
        headcountMismatchPercentage: "在岗人数不匹配",
        pfEsiMismatchPercentage: "PF/ESI 不匹配",
        wrongClassificationPercentage: "错误用工分类风险",
        backgroundCheckFailures: "背景调查失败",
        productivityLossDays: "生产力损失（天/年）",
      },
      losses: {
        ghostWorkers: "幽灵员工",
        buddyPunching: "代打卡/工时盗用",
        overtime: "加班虚增",
        overbilling: "发票超额计费",
        headcountMismatch: "在岗人数不匹配",
        pfEsiPenalties: "PF/ESI 罚款",
        classificationRisk: "分类风险",
        backgroundCheckFailures: "背景调查失败",
        productivityLoss: "生产力损失",
        adminOverhead: "管理开销",
      },
      details: {
        ghostWorkers: (count: number) => `${Math.round(count)} 名幽灵员工`,
        buddyPunching: (count: number) => `${Math.round(count)} 名受影响员工`,
        overtime: "虚增加班申报",
        overbilling: "供应商计费差异",
        headcountMismatch: "人员未到岗",
        pfEsiPenalties: "不合规罚款",
        classificationRisk: "追补税费风险",
        backgroundCheckFailures: (count: number) => `${Math.round(count)} 起事件`,
        productivityLoss: "劳动力效率低下",
        adminOverhead: "人工处理成本",
      },
    },
  } as const;

  const pageTranslations = {
    en: {
      nav: {
        solutions: "Solutions",
        modules: "Modules",
        industries: "Industries",
        deploymentConsole: "Deployment Console",
        calculator: "Calculator",
      },
      header: {
        language: "Language",
        getStarted: "Get started",
        supportAria: "Support",
        messagesAria: "Messages",
        searchAria: "Search",
        langEn: "EN",
        langZh: "中文",
      },
      home: {
        heroLine1: "Turn Compliance Challenges",
        heroLine2: "into Opportunities",
        heroLine3: "with CLMS",
        heroDescription:
          "One Unified Platform for Complete Control. Eliminate manual effort with AI powered attendance, automated compliance, and real-time workforce visibility.",
        getInTouch: "Get In Touch",
        learnMore: "Learn More",
        aiBubble1: "AI Powered Compliance Monitoring",
        aiBubble2: "Geo Fencing and Real Time Tracking",
        aiCenter: "Transform Contract Labour Management",
        aiBubble4: "Automated blacklisting and access alerts",
        aiBubble5: "e-KYC and digital documentation",
        whyTitle: "Why Iddion?",
        whyDescription:
          "Data driven decision making, security and compliance first approach, scalable deployments, hardware and software integration, and end to end compliance automation in one platform.",
        automationHighlights: "/ AUTOMATION HIGHLIGHTS",
        smartHardwareTitle: "Smart Contract Labour Management with Integrated Hardware",
        smartHardwareDescription:
          "Manage your contract workforce with biometric readers, access control, turnstiles, flap barriers, real-time attendance, and automated alerts for early exits, overstays, and unauthorized access.",
        explorePlatform: "Explore Platform",
        corePlatform: "/ CORE PLATFORM",
        verifiedWorkforce: "No More Ghost Employees. Just Verified Workforce.",
        previousAria: "Previous",
        nextAria: "Next",
        preventPilferage: "Prevent Pilferage with Smart Access Control",
        preventPilferageDescription:
          "Ensure only authorized personnel access your premises with real-time movement tracking and contract-based entry rules. Reduce theft, prevent misuse, and improve accountability.",
        startProject: "Start A Project",
        ourModules: "/ OUR MODULES",
        smartAutomationTitle: "Transform Contract Labour Management with Smart Automation",
        complianceRegulations: "Compliance & Regulations",
        complianceDescription:
          "Automated tracking of labor laws, safety standards, wages, PF and ESIC with timely compliance alerts and audit-ready reporting.",
        timeAttendanceLeave: "Time, Attendance & Leave",
        timeAttendanceDescription:
          "Accurate attendance, overtime and leave tracking with geo-tagging, facial recognition, and real-time dashboards for productivity and payroll.",
        getInTouchTitle: "Get in Touch",
        getInTouchDescription: "Share your details below. Our team will get in touch with latest updates and product insights.",
        contactTitle: "Contact",
        addressTitle: "Address",
        addressLine: "921, Laxmi Tower, 5th Main Rd, Sector 7, HSR Layout, Bengaluru, Karnataka 560102",
      },
      footer: {
        core: "Core",
        modules: "Modules",
        industries: "Industries",
        company: "Company",
        coreItems: ["Compliance & Regulations", "Time, Attendance & Leave", "KYE Employee Verification"],
        modulesItems: [
          "Visitor Management",
          "Canteen Management",
          "Contractor Self Service Portal",
          "AI Compliance Monitoring",
          "Access Control Integration",
          "e-KYC & Digital Documentation",
          "Automated Alerts & Escalations",
        ],
        industriesItems: ["Manufacturing", "Logistics", "Automobile", "Pharmaceuticals", "Warehousing", "Infrastructure & EPC", "Facility Management"],
        companyItems: [
          "About",
          "Security & Compliance",
          "Scalable Deployments",
          "ERP and Payroll Integration",
          "Driving ESG Aligned Compliance",
          "Case Studies",
          "Implementation & Support",
          "Contact Us",
        ],
        legalLinks: ["Modern Slavery Statement", "Accessibility", "Cookie Notice", "Terms of Use", "Privacy Notice"],
        copyright: "Copyright 2026 Iddion. All rights reserved.",
      },
    },
    zh: {
      nav: {
        solutions: "解决方案",
        modules: "模块",
        industries: "行业",
        deploymentConsole: "部署控制台",
        calculator: "计算器",
      },
      header: {
        language: "语言",
        getStarted: "立即开始",
        supportAria: "支持",
        messagesAria: "消息",
        searchAria: "搜索",
        langEn: "EN",
        langZh: "中文",
      },
      home: {
        heroLine1: "将合规挑战",
        heroLine2: "转化为机会",
        heroLine3: "借助 CLMS",
        heroDescription: "一个统一平台实现全面管控。通过 AI 考勤、自动化合规和实时劳动力可视化，减少人工工作量。",
        getInTouch: "联系我们",
        learnMore: "了解更多",
        aiBubble1: "AI 驱动合规监控",
        aiBubble2: "电子围栏与实时追踪",
        aiCenter: "升级合同劳务管理",
        aiBubble4: "自动黑名单与门禁预警",
        aiBubble5: "电子 KYC 与数字文档",
        whyTitle: "为什么选择 Iddion？",
        whyDescription: "数据驱动决策、安全与合规优先、可扩展部署、软硬件一体化，以及端到端合规自动化。",
        automationHighlights: "/ 自动化亮点",
        smartHardwareTitle: "集成硬件的智能合同劳务管理",
        smartHardwareDescription: "通过生物识别、门禁、闸机、实时考勤与自动告警，全面管理合同劳动力并降低风险。",
        explorePlatform: "探索平台",
        corePlatform: "/ 核心平台",
        verifiedWorkforce: "告别幽灵员工，打造可验证劳动力",
        previousAria: "上一项",
        nextAria: "下一项",
        preventPilferage: "用智能门禁减少盗损",
        preventPilferageDescription: "基于实时轨迹和合同规则限制出入，防止盗窃和滥用，提升责任追踪能力。",
        startProject: "开始项目",
        ourModules: "/ 我们的模块",
        smartAutomationTitle: "通过智能自动化重塑合同劳务管理",
        complianceRegulations: "合规与法规",
        complianceDescription: "自动跟踪劳动法规、安全标准、工资、PF 与 ESIC，及时预警并生成可审计报告。",
        timeAttendanceLeave: "时间、考勤与请假",
        timeAttendanceDescription: "通过地理标记、人脸识别和实时看板，准确管理考勤、加班与请假。",
        getInTouchTitle: "联系我们",
        getInTouchDescription: "留下您的信息，我们的团队将联系您并分享最新产品动态。",
        contactTitle: "联系方式",
        addressTitle: "地址",
        addressLine: "921, Laxmi Tower, 5th Main Rd, Sector 7, HSR Layout, Bengaluru, Karnataka 560102",
      },
      footer: {
        core: "核心",
        modules: "模块",
        industries: "行业",
        company: "公司",
        coreItems: ["合规与法规", "时间、考勤与请假", "KYE 员工核验"],
        modulesItems: ["访客管理", "食堂管理", "承包商自助门户", "AI 合规监控", "门禁集成", "电子 KYC 与数字文档", "自动预警与升级"],
        industriesItems: ["制造业", "物流", "汽车", "制药", "仓储", "基础设施与 EPC", "设施管理"],
        companyItems: ["关于", "安全与合规", "可扩展部署", "ERP 与薪资集成", "ESG 合规实践", "案例研究", "实施与支持", "联系我们"],
        legalLinks: ["现代奴役声明", "无障碍", "Cookie 通知", "使用条款", "隐私声明"],
        copyright: "版权所有 2026 Iddion。保留所有权利。",
      },
    },
  } as const;

  const text = pageTranslations[pageLanguage];
  const calcText = calculatorTranslations[pageLanguage];
  const resolveViewFromNav = (item: (typeof navItems)[number]) => {
    if (item === "calculator") return "calculator" as const;
    if (item === "deploymentConsole") return "deployment" as const;
    return "home" as const;
  };

  const sliderConfig = [
    ["ghostWorkerPercentage", 0, 15, 0.5],
    ["buddyPunchingPercentage", 0, 10, 0.5],
    ["overtimeInflationPercentage", 0, 20, 0.5],
    ["invoiceOverbillingPercentage", 0, 10, 0.5],
    ["headcountMismatchPercentage", 0, 8, 0.5],
    ["pfEsiMismatchPercentage", 0, 15, 0.5],
    ["wrongClassificationPercentage", 0, 10, 0.5],
    ["backgroundCheckFailures", 0, 10, 0.5],
    ["productivityLossDays", 0, 20, 1],
  ] as const;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `Rs ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(2)} L`;
    return `Rs ${Math.round(amount).toLocaleString("en-IN")}`;
  };

  const calc = useMemo(() => {
    const s = calcState;
    const monthlySpend = s.totalContractors * s.avgMonthlyCostPerContractor;
    const annualSpend = monthlySpend * 12;
    const ghostWorkersCount = (s.totalContractors * s.ghostWorkerPercentage) / 100;
    const ghostWorkersAnnualLoss = ghostWorkersCount * s.avgMonthlyCostPerContractor * 12;
    const buddyPunchingCount = (s.totalContractors * s.buddyPunchingPercentage) / 100;
    const buddyPunchingAnnualLoss = buddyPunchingCount * s.avgMonthlyCostPerContractor * 12 * 0.2;
    const overtimeAnnualLoss = (annualSpend * s.overtimeInflationPercentage) / 100;
    const overbillingAnnualLoss = (annualSpend * s.invoiceOverbillingPercentage) / 100;
    const headcountMismatchLoss = (annualSpend * s.headcountMismatchPercentage) / 100;
    const pfEsiPenaltyLoss = ((annualSpend * s.pfEsiMismatchPercentage) / 100) * 0.5;
    const classificationRisk = (annualSpend * s.wrongClassificationPercentage) / 100;
    const bgCheckFailuresCount = (s.totalContractors * s.backgroundCheckFailures) / 100;
    const bgCheckLoss = bgCheckFailuresCount * 50000;
    const productivityLoss = s.totalContractors * (s.productivityLossDays * 500);
    const adminOverhead = s.totalContractors * 1200;

    const totalAnnualLoss =
      ghostWorkersAnnualLoss +
      buddyPunchingAnnualLoss +
      overtimeAnnualLoss +
      overbillingAnnualLoss +
      headcountMismatchLoss +
      pfEsiPenaltyLoss +
      classificationRisk +
      bgCheckLoss +
      productivityLoss +
      adminOverhead;
    const lossPercentage = (totalAnnualLoss / annualSpend) * 100;
    const platformCost = s.totalContractors * 150 * 12;
    const netSavings = totalAnnualLoss - platformCost;
    const roiMultiple = totalAnnualLoss / platformCost;

    return {
      annualSpend,
      totalAnnualLoss,
      lossPercentage,
      platformCost,
      netSavings,
      roiMultiple,
      ghostWorkersCount,
      buddyPunchingCount,
      ghostWorkersAnnualLoss,
      buddyPunchingAnnualLoss,
      overtimeAnnualLoss,
      overbillingAnnualLoss,
      headcountMismatchLoss,
      pfEsiPenaltyLoss,
      classificationRisk,
      bgCheckFailuresCount,
      bgCheckLoss,
      productivityLoss,
      adminOverhead,
    };
  }, [calcState]);

  const lossBreakdownItems = [
    { label: calcText.losses.ghostWorkers, amount: calc.ghostWorkersAnnualLoss, detail: calcText.details.ghostWorkers(calc.ghostWorkersCount) },
    { label: calcText.losses.buddyPunching, amount: calc.buddyPunchingAnnualLoss, detail: calcText.details.buddyPunching(calc.buddyPunchingCount) },
    { label: calcText.losses.overtime, amount: calc.overtimeAnnualLoss, detail: calcText.details.overtime },
    { label: calcText.losses.overbilling, amount: calc.overbillingAnnualLoss, detail: calcText.details.overbilling },
    { label: calcText.losses.headcountMismatch, amount: calc.headcountMismatchLoss, detail: calcText.details.headcountMismatch },
    { label: calcText.losses.pfEsiPenalties, amount: calc.pfEsiPenaltyLoss, detail: calcText.details.pfEsiPenalties },
    { label: calcText.losses.classificationRisk, amount: calc.classificationRisk, detail: calcText.details.classificationRisk },
    { label: calcText.losses.backgroundCheckFailures, amount: calc.bgCheckLoss, detail: calcText.details.backgroundCheckFailures(calc.bgCheckFailuresCount) },
    { label: calcText.losses.productivityLoss, amount: calc.productivityLoss, detail: calcText.details.productivityLoss },
    { label: calcText.losses.adminOverhead, amount: calc.adminOverhead, detail: calcText.details.adminOverhead },
  ];

  const pageStyles = `
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #4f46e5;
          cursor: pointer;
          border-radius: 50%;
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #4f46e5;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }

        .hero-content {
          animation: slideInLeft 650ms ease-out both;
        }

        .hero-media {
          animation: mediaEnter 800ms ease-out both;
        }

        .ai-chat-item {
          opacity: 0;
          transform: translateY(8px);
          animation: bubbleIn 520ms ease-out forwards;
        }

        .ai-chat-stack .ai-chat-item:nth-child(1) { animation-delay: 120ms; }
        .ai-chat-stack .ai-chat-item:nth-child(2) { animation-delay: 320ms; }
        .ai-chat-stack .ai-chat-item:nth-child(3) { animation-delay: 520ms; }
        .ai-chat-stack .ai-chat-item:nth-child(4) { animation-delay: 720ms; }
        .ai-chat-stack .ai-chat-item:nth-child(5) { animation-delay: 920ms; }

        .typing-line {
          display: block;
          width: max-content;
          clip-path: inset(0 100% 0 0);
          animation: typeReveal 900ms steps(20, end) forwards;
        }

        .line-2 {
          animation-delay: 900ms;
        }

        .line-3 {
          animation-delay: 1800ms;
        }

        @keyframes typeReveal {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes mediaEnter {
          from { opacity: 0; transform: translateX(22px) scale(0.985); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;

  return (
    <div className="min-h-screen bg-white text-[#0a2a33]">
      <header className="border-t-4 border-[#005b8f] bg-[#f1f2f3]">
        <div className="mx-auto flex h-[78px] w-full items-center justify-between px-10 lg:px-12">
          <div className="flex min-w-0 items-center gap-5">
            <div className="shrink-0 text-[46px] font-extrabold leading-none tracking-tight text-[#005f67]">IDDION</div>
            <nav aria-label="Primary" className="hidden min-w-0 items-center gap-5 text-[18px] font-normal leading-none text-[#001d3a] xl:flex">
              {navItems.map((item) => (
                <button
                  key={item}
                  className={`flex shrink-0 items-center gap-2 transition-colors hover:text-[#005f67] ${
                    item === "calculator" || item === "deploymentConsole" ? "font-medium" : ""
                  } ${resolveViewFromNav(item) === activeView ? "text-[#005f67]" : ""}`}
                  type="button"
                  onClick={() => setActiveView(resolveViewFromNav(item))}
                >
                  <span>{text.nav[item]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[#006b73]">
            {/* <button aria-label={text.header.supportAria} className="hidden h-10 w-10 items-center justify-center xl:flex" type="button">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 0 0-9 9v2a3 3 0 0 0 3 3h1v-6H6a6 6 0 0 1 12 0h-1v6h1a3 3 0 0 0 3-3v-2a9 9 0 0 0-9-9Z" />
                <path d="M9 19a3 3 0 0 0 6 0" />
              </svg>
            </button>

            <button aria-label={text.header.messagesAria} className="hidden h-10 w-10 items-center justify-center xl:flex" type="button">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M4 6h16v10H7l-3 3V6Z" />
                <path d="M8 10h8" />
              </svg>
            </button> */}

            <div className="flex items-center gap-3 rounded-full border border-[#0d7c84]/25 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eaf7f8] text-[#006b73]" aria-hidden="true">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-[#005c64]">{text.header.language}</span>
              <div className="flex rounded-full bg-[#e9f5f6] p-0.5">
                <button
                  type="button"
                  onClick={() => setPageLanguage("en")}
                  aria-pressed={pageLanguage === "en"}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    pageLanguage === "en" ? "bg-[#0d7c84] text-white shadow-sm" : "text-[#0f5e66] hover:bg-[#d4ecee]"
                  }`}
                >
                  {text.header.langEn}
                </button>
                <button
                  type="button"
                  onClick={() => setPageLanguage("zh")}
                  aria-pressed={pageLanguage === "zh"}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    pageLanguage === "zh" ? "bg-[#0d7c84] text-white shadow-sm" : "text-[#0f5e66] hover:bg-[#d4ecee]"
                  }`}
                >
                  {text.header.langZh}
                </button>
              </div>
            </div>

            <Link href="/login" className="grid h-9 min-w-[178px] place-items-center whitespace-nowrap bg-[#d6f500] px-9 text-[18px] font-medium leading-none text-[#0f172a]">
              {text.header.getStarted}
            </Link>

            <button aria-label={text.header.searchAria} className="hidden h-10 w-10 items-center justify-center xl:flex" type="button">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {activeView === "home" ? (
        <>
      <main className="relative overflow-hidden bg-[#45cbc3] py-6 lg:py-7">
        <div className="pointer-events-none absolute right-[46.8%] top-0 hidden h-16 w-64 -skew-x-[42deg] bg-[#005f62] lg:block" />
        <div className="pointer-events-none absolute bottom-0 right-0 hidden h-16 w-64 -skew-x-[42deg] bg-[#005f62] lg:block" />

        <div className="mx-auto grid w-full max-w-[1380px] grid-cols-1 items-stretch gap-6 px-6 lg:grid-cols-[39%_61%] lg:gap-8 lg:px-8">
          <section className="hero-content flex flex-col justify-center px-3 lg:px-6">
            <h1 className="max-w-[560px] text-[30px] font-medium leading-[1.08] text-[#004f5b] lg:text-[44px]">
              <span className="typing-line line-1">{text.home.heroLine1}</span>
              <span className="typing-line line-2">{text.home.heroLine2}</span>
              <span className="typing-line line-3">{text.home.heroLine3}</span>
            </h1>
            <p className="mt-6 max-w-[620px] text-[16px] leading-[1.32] text-[#022f39] lg:text-[20px]">
              {text.home.heroDescription}
            </p>
            <div className="mt-5 flex gap-3">
              <button className="w-fit bg-[#d6f500] px-7 py-2.5 text-[16px] font-medium text-[#0f172a] transition-transform duration-300 hover:-translate-y-0.5" type="button">
                {text.home.getInTouch}
              </button>
              <button className="w-fit border border-[#004f5b] px-7 py-2.5 text-[16px] font-medium text-[#004f5b]" type="button">
                {text.home.learnMore}
              </button>
            </div>
          </section>

          <section className="hero-media relative overflow-hidden bg-[#0d1a1d] md:ml-12">
            <div
              className="h-[430px] w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80')",
              }}
            />
            <div className="absolute bottom-6 left-6 grid h-14 w-14 place-items-center bg-[#e8ecc4] text-[32px] leading-none text-[#2f3a2d]">
              ||
            </div>
          </section>
        </div>
      </main>

      <section className="bg-[#f2f2f2] py-12 lg:py-14">
        <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8">
          <div className="grid border border-[#aeb3b7] bg-[#f2f2f2] lg:grid-cols-[54%_46%]">
            <div
              className="relative min-h-[350px] overflow-hidden bg-[#b99263] bg-cover lg:min-h-[420px]"
              style={{
                backgroundImage:
                  "url('/images/worker.jpg')",
                backgroundPosition: "right center",
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.22)_100%)]" />
              <div className="absolute left-[58%] top-0 h-full w-3 bg-[linear-gradient(180deg,#35b9e0_0%,#7b64d8_45%,#d11bb8_100%)]" />

              <div className="ai-chat-stack absolute right-5 top-10 z-10 flex w-[90%] max-w-[620px] flex-col items-end gap-4 lg:right-8 lg:top-12 lg:gap-5">
                {/* <div className="ai-chat-item w-fit max-w-full rounded-full bg-white/90 px-3 py-2 text-right text-[11px] text-[#4a4f55] shadow lg:text-[12px]">
                  {text.home.aiBubble1}
                </div>
                <div className="ai-chat-item w-fit max-w-full rounded-full bg-white/90 px-3 py-2 text-right text-[11px] text-[#4a4f55] shadow lg:text-[12px]">
                  {text.home.aiBubble2}
                </div>
                <div className="ai-chat-item flex w-[86%] min-w-[300px] max-w-full items-center rounded-full bg-white px-2.5 py-2.5 shadow-lg lg:w-[82%] lg:min-w-[360px] lg:px-3 lg:py-3">
                  <span className="grid h-8 w-8 place-items-center text-[#4784d7] lg:h-9 lg:w-9" aria-hidden="true">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="6" />
                      <path d="m20 20-4-4" />
                    </svg>
                  </span>
                  <span className="flex-1 text-center text-[17px] font-semibold text-[#3d4248] lg:text-[22px]">{text.home.aiCenter}</span>
                  <span className="grid h-8 w-8 place-items-center text-[#4784d7] lg:h-9 lg:w-9" aria-hidden="true">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </div>
                <div className="ai-chat-item w-fit max-w-full rounded-full bg-white/90 px-3 py-2 text-right text-[11px] text-[#4a4f55] shadow lg:px-4 lg:py-2.5 lg:text-[12px]">
                  {text.home.aiBubble4}
                </div>
                <div className="ai-chat-item w-fit max-w-full rounded-full bg-white/90 px-3 py-2 text-right text-[11px] text-[#4a4f55] shadow lg:px-4 lg:py-2.5 lg:text-[12px]">
                  {text.home.aiBubble5}
                </div> */}
              </div>
            </div>

            <div className="flex items-center bg-[#f2f2f2] px-8 py-10 lg:px-12 lg:py-12">
              <div className="max-w-[620px]">
                <h2 className="text-[20px] font-medium leading-[1.1] text-[#005567] lg:text-[32px]">{text.home.whyTitle}</h2>
                <p className="mt-6 text-[14px] leading-[1.32] text-[#0d1d23] lg:text-[18px]">
                  {text.home.whyDescription}
                </p>
                <button className="mt-6 bg-[#d6f500] px-8 py-3 text-[16px] font-medium text-[#0e161b] lg:text-[18px]" type="button">
                  {text.home.learnMore}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 border-b border-[#8d8f92] py-3 text-[8px] font-medium text-[#005567] lg:text-[15px]">{text.home.automationHighlights}</div>
        </div>
      </section>

      <section className="bg-[#f2f2f2] py-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8">
          <div className="relative grid overflow-hidden border border-[#aeb3b7] bg-[#f2f2f2] lg:grid-cols-[46%_54%]">
            <div className="pointer-events-none absolute left-0 top-[38%] h-px w-full bg-[#46d8cf]" />
            <div className="z-10 flex items-center bg-[#f2f2f2] px-8 py-10 lg:px-12 lg:py-12">
              <div className="max-w-[620px]">
                <h2 className="text-[20px] font-medium leading-[1.15] text-[#005567] lg:text-[32px]">
                  {text.home.smartHardwareTitle}
                </h2>
                <p className="mt-4 text-[14px] leading-[1.35] text-[#0d1d23] lg:text-[18px]">
                  {text.home.smartHardwareDescription}
                </p>
                <button className="mt-6 bg-[#d6f500] px-8 py-3 text-[16px] font-medium text-[#0e161b] lg:text-[18px]" type="button">
                  {text.home.explorePlatform}
                </button>
              </div>
            </div>
            <div
              className="min-h-[350px] bg-cover bg-center lg:min-h-[420px]"
              style={{
                backgroundImage:
                  "url('/images/cso-dashboard.png')",
              }}
            />
          </div>

          <div className="mt-8 border-b border-[#8d8f92] py-3 text-[8px] font-medium text-[#005567] lg:text-[15px]">{text.home.corePlatform}</div>
        </div>
      </section>

      <section className="bg-[#f2f2f2] py-8 lg:py-10">
        <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[28px] font-medium text-[#005567] lg:text-[36px]">{text.home.verifiedWorkforce}</h3>
            <div className="flex gap-3">
              <button className="grid h-10 w-10 place-items-center bg-[#dce680] text-[#6a7378]" type="button" aria-label={text.home.previousAria}>
                &#8592;
              </button>
              <button className="grid h-10 w-10 place-items-center bg-[#d6f500] text-[#0f172a]" type="button" aria-label={text.home.nextAria}>
                &#8594;
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden border border-[#96a7ab]">
            <div
              className="min-h-[360px] bg-cover bg-[position:78%_center] lg:min-h-[520px]"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1800&q=80')",
              }}
            />
            <div className="absolute inset-y-0 right-0 w-6 bg-[#066f72]" />
            <div className="absolute inset-y-0 left-0 w-[68%] bg-[#005b61] [clip-path:polygon(0_0,43%_0,100%_100%,0_100%)]" />

            <div className="absolute left-8 top-10 z-10 max-w-[44%] text-white lg:left-12 lg:top-14">
              <h4 className="text-[18px] font-medium leading-[1.2] lg:text-[32px]">{text.home.preventPilferage}</h4>
              <p className="mt-3 text-[14px] leading-[1.35] lg:text-[20px]">
                {text.home.preventPilferageDescription}
              </p>
              <button className="mt-4 bg-[#d6f500] px-6 py-2.5 text-[16px] font-medium text-[#0f172a] lg:mt-6 lg:px-8 lg:py-3 lg:text-[20px]" type="button">
                {text.home.startProject}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f2f2f2] py-8 lg:py-10">
        <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8">
          <div className="border-b border-[#8d8f92] pb-1 text-[14px] font-medium text-[#005567] lg:text-[18px]">{text.home.ourModules}</div>
          <h3 className="pt-8 text-[28px] font-medium text-[#005567] lg:text-[36px]">{text.home.smartAutomationTitle}</h3>

          <div className="group relative mt-7 overflow-hidden border-b border-[#b6b9bc] bg-[#f2f2f2] py-5 lg:py-6">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full origin-right scale-x-0 bg-[#d6f500] transition-transform duration-700 group-hover:scale-x-100 [clip-path:polygon(100%_0,100%_100%,0_100%,4%_50%,0_0)]" />
            <div className="relative z-10 grid items-start gap-5 lg:grid-cols-[30%_45%_25%]">
              <div className="pt-2 pl-4 text-[17px] font-medium text-[#005567] lg:text-[24px]">{text.home.complianceRegulations}</div>
              <div className="pt-4 max-w-[92%] text-[13px] leading-[1.25] text-[#4a4f55] lg:max-w-[88%] lg:text-[18px]">
                {text.home.complianceDescription}
              </div>
              <div
                className="h-[120px] bg-cover bg-center lg:h-[220px]"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80')",
                }}
              />
            </div>
          </div>

          <div className="group relative mt-4 overflow-hidden border-b border-[#b6b9bc] bg-[#f2f2f2] py-5 lg:py-6">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full origin-right scale-x-0 bg-[#d6f500] transition-transform duration-700 group-hover:scale-x-100 [clip-path:polygon(100%_0,100%_100%,0_100%,4%_50%,0_0)]" />
            <div className="relative z-10 grid items-start gap-5 lg:grid-cols-[30%_45%_25%]">
              <div className="pt-2 pl-4 text-[17px] font-medium text-[#005567] lg:text-[24px]">{text.home.timeAttendanceLeave}</div>
              <div className="pt-2 max-w-[92%] text-[13px] leading-[1.25] text-[#62656b] lg:max-w-[88%] lg:text-[18px]">
                {text.home.timeAttendanceDescription}
              </div>
              <div
                className="h-[120px] bg-cover bg-center lg:h-[220px]"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80')",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f2f2f2] pb-8">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
          <div className="grid gap-10 bg-[#f2f2f2] py-8 lg:grid-cols-3 lg:gap-6 lg:py-10">
            <div className="relative text-center lg:px-8">
              <h4 className="text-[40px] font-semibold leading-none text-[#0e1114] lg:text-[18px]">{text.home.getInTouchTitle}</h4>
              <p className="mt-4 text-[16px] leading-[1.35] text-[#005567]">
                {text.home.getInTouchDescription}
              </p>
              <span className="pointer-events-none absolute -right-3 top-1/2 hidden h-10 w-px -translate-y-1/2 -rotate-[42deg] bg-[#8d8f92] lg:block" />
            </div>
            <div className="relative text-center lg:px-8">
              <p className="text-[40px] font-semibold leading-none text-[#0e1114] lg:text-[18px]">{text.home.contactTitle}</p>
              <p className="mt-4 text-[16px] leading-[1.35] text-[#005567]">+91 80886 02602</p>
              <p className="text-[16px] leading-[1.35] text-[#005567]">hello@iddion.com</p>
              <span className="pointer-events-none absolute -right-3 top-1/2 hidden h-10 w-px -translate-y-1/2 -rotate-[42deg] bg-[#8d8f92] lg:block" />
            </div>
            <div className="text-center lg:px-8">
              <p className="text-[40px] font-semibold leading-none text-[#0e1114] lg:text-[18px]">{text.home.addressTitle}</p>
              <p className="mt-4 text-[16px] leading-[1.35] text-[#005567]">
                {text.home.addressLine}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden border-t-2 border-[#53d8d0] bg-[#40cbc3] px-6 pb-8 pt-8 lg:px-10 lg:pb-10 lg:pt-10">
        <div className="pointer-events-none absolute left-[220px] top-0 h-full w-[520px] -skew-x-[46deg] bg-[#53d8d0]/40" />

        <div className="relative mx-auto w-full max-w-[1860px]">
          <div className="grid gap-8 lg:grid-cols-[28%_72%] lg:gap-10">
            <div>
              <div className="text-[42px] font-extrabold leading-[0.86] tracking-tight text-[#005b61] lg:text-[90px]">IDDION</div>
              <div className="mt-8 flex flex-wrap gap-3 text-[#40cbc3] lg:gap-4">
                {["in", "yt", "ig", "fb", "x", "tt"].map((icon) => (
                  <div key={icon} className="grid h-10 w-10 place-items-center bg-[#005b61] text-[14px] font-semibold uppercase">
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-8 text-[#005b61] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h4 className="text-[14px] font-semibold lg:text-[16px]">{text.footer.core}</h4>
                <ul className="mt-4 space-y-4 text-[12px] lg:text-[14px]">
                  {text.footer.coreItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold lg:text-[16px]">{text.footer.modules}</h4>
                <ul className="mt-4 space-y-4 text-[12px] lg:text-[14px]">
                  {text.footer.modulesItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold lg:text-[16px]">{text.footer.industries}</h4>
                <ul className="mt-4 space-y-4 text-[12px] lg:text-[14px]">
                  {text.footer.industriesItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold lg:text-[16px]">{text.footer.company}</h4>
                <ul className="mt-4 space-y-4 text-[12px] lg:text-[14px]">
                  {text.footer.companyItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#0f696e] pt-5 text-[#003f45] lg:mt-10 lg:pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-5 text-[12px] lg:gap-7 lg:text-[13px]">
                {text.footer.legalLinks.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="text-[12px] lg:text-[13px]">{text.footer.copyright}</div>
            </div>
          </div>
        </div>
      </footer>
        </>
      ) : activeView === "calculator" ? (
        <section className="min-h-[calc(100vh-78px)] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-gray-800">{calcText.pageTitle}</h1>
              <p className="mt-2 text-lg text-gray-600">{calcText.pageSubtitle}</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-gray-800">{calcText.workforceDetails}</h2>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">{calcText.totalContractWorkers}</label>
                    <input
                      type="number"
                      value={calcState.totalContractors}
                      onChange={(e) => setCalcState((prev) => ({ ...prev, totalContractors: Number(e.target.value) || 0 }))}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">{calcText.avgMonthlyCostPerContractor}</label>
                    <input
                      type="number"
                      value={calcState.avgMonthlyCostPerContractor}
                      onChange={(e) => setCalcState((prev) => ({ ...prev, avgMonthlyCostPerContractor: Number(e.target.value) || 0 }))}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4 border-t-2 border-gray-200 pt-4">
                    {sliderConfig.map(([key, min, max, step]) => (
                      <div key={String(key)}>
                        <label className="mb-1 block text-sm text-gray-700">
                          {calcText.sliders[key]}: {calcState[key as keyof typeof calcState]}
                          {key === "productivityLossDays" ? "" : "%"}
                        </label>
                        <input
                          type="range"
                          min={Number(min)}
                          max={Number(max)}
                          step={Number(step)}
                          value={calcState[key as keyof typeof calcState] as number}
                          onChange={(e) =>
                            setCalcState((prev) => ({
                              ...prev,
                              [key]: Number(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-8 text-white shadow-2xl">
                  <h2 className="text-2xl font-bold">{calcText.totalAnnualLoss}</h2>
                  <div className="mt-3 text-5xl font-bold">{formatCurrency(calc.totalAnnualLoss)}</div>
                  <div className="mt-2 text-xl opacity-90">
                    {calc.lossPercentage.toFixed(2)}% {calcText.annualSpendSuffix}
                  </div>
                  <div className="mt-4 border-t border-red-400 pt-4">
                    <div className="text-sm opacity-80">{calcText.annualContractorSpend}</div>
                    <div className="text-2xl font-semibold">{formatCurrency(calc.annualSpend)}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-bold text-gray-800">{calcText.lossBreakdown}</h3>
                  <div className="space-y-3">
                    {lossBreakdownItems.map(({ label, amount, detail }) => (
                      <div key={label} className="flex items-start justify-between rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100">
                        <div>
                          <div className="font-semibold text-gray-800">{label}</div>
                          <div className="mt-1 text-xs text-gray-600">{detail}</div>
                        </div>
                        <div className="font-bold text-red-600">{formatCurrency(Number(amount))}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
                  <h3 className="mb-3 text-xl font-bold">{calcText.roiInsight}</h3>
                  <p className="text-lg">
                    {calcText.platformCost}: {formatCurrency(calc.platformCost)}
                    {calcText.perYearSuffix}
                  </p>
                  <p className="mt-2 text-lg">
                    {calcText.potentialSavings}: <span className="text-3xl font-bold">{formatCurrency(calc.netSavings)}</span>
                  </p>
                  <p className="mt-3 text-sm opacity-90">
                    {calcText.firstYearRoiPrefix} <span className="font-bold">{calc.roiMultiple.toFixed(1)}x ROI</span>{" "}
                    {calcText.firstYearRoiSuffix}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <InOpsDeployment />
      )}

      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: pageStyles }} />
    </div>
  );
}
