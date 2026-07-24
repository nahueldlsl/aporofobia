export class DOMManager {
  constructor() {
    this.views = {
      landing: document.getElementById('viewLanding'),
      student: document.getElementById('viewStudent'),
      teacher: document.getElementById('viewTeacher'),
      debrief: document.getElementById('viewDebrief')
    };
    
    this.timer = {
      header: document.getElementById('headerTimer'),
      text: document.getElementById('timerText')
    };

    this.landing = {
      studentName: document.getElementById('studentName'),
      studentRoom: document.getElementById('studentRoomCode'),
      teacherRoom: document.getElementById('teacherRoomCode'),
      btnJoinStudent: document.getElementById('btnJoinStudent'),
      btnCreateRoom: document.getElementById('btnCreateRoom')
    };

    this.student = {
      name: document.getElementById('displayStudentName'),
      roleBadge: document.getElementById('studentRoleBadge'),
      roleDesc: document.getElementById('roleDescription'),
      valResources: document.getElementById('valResources'),
      barResources: document.getElementById('barResources'),
      valDignity: document.getElementById('valDignity'),
      barDignity: document.getElementById('barDignity'),
      foreignBadge: document.getElementById('foreignBadgeContainer'),
      cortinaChapter: document.getElementById('studentCortinaChapter'),
      cortinaQuote: document.getElementById('studentCortinaQuote'),
      btnPaySurvival: document.getElementById('btnPaySurvival'),
      btnProtest: document.getElementById('btnProtest'),
      btnSkipProtest: document.getElementById('btnSkipProtest'),
      survivalStatus: document.getElementById('survivalStatus'),
      survivalDesc: document.getElementById('survivalDescriptionText'),
      objectiveText: document.getElementById('studentObjectiveText'),
      phases: {
        lobby: document.getElementById('studentLobbyPhase'),
        phase1: document.getElementById('studentPhase1'),
        phase2: document.getElementById('studentPhase2'),
        phase2Decision: document.getElementById('phase2DecisionView'),
        phase2Waiting: document.getElementById('phase2WaitingView'),
        phase3: document.getElementById('studentPhase3')
      },
      requestContainer: document.getElementById('requestContainer'),
      resolutionTitle: document.getElementById('resolutionTitle'),
      resolutionDesc: document.getElementById('resolutionDesc')
    };

    this.teacher = {
      roomCode: document.getElementById('displayRoomCode'),
      valGini: document.getElementById('valGini'),
      valHostRate: document.getElementById('valHostRate'),
      valInvisible: document.getElementById('valInvisible'),
      valEliteInactive: document.getElementById('valEliteInactive'),
      revoltBanner: document.getElementById('revoltBanner'),
      revoltTitle: document.getElementById('revoltTitle'),
      revoltMessage: document.getElementById('revoltMessage'),
      studentsGrid: document.getElementById('studentsGrid'),
      cortinaChapter: document.getElementById('teacherCortinaChapter'),
      cortinaQuote: document.getElementById('teacherCortinaQuote'),
      btnMasterNext: document.getElementById('btnMasterNext'),
      btnOpenGuide: document.getElementById('btnOpenGuide'),
      btnCloseGuide: document.getElementById('btnCloseGuide'),
      guideModal: document.getElementById('teacherGuideModal'),
      btnShowDebrief: document.getElementById('btnShowDebrief'),
      btnBackToTeacher: document.getElementById('btnBackToTeacher'),
      teleprompter: document.getElementById('teleprompterInstruction')
    };

    this.debrief = {
      diagnosisText: document.getElementById('debriefDiagnosisText'),
      statsSummary: document.getElementById('debriefStatsSummary'),
      giniChart: document.getElementById('giniChartCanvas'),
      biasChart: document.getElementById('biasChartCanvas')
    };
  }
}
