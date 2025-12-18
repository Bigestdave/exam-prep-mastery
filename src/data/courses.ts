export interface Question {
  q: string;
  a: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
  questions: Question[];
}

export const courses: Course[] = [
  {
    id: "irm102",
    code: "IRM 102",
    title: "Library Routines",
    faculty: "IRM",
    level: "100L",
    price: 1000,
    questions: [
      { q: "How do the routines of academic, public, and special libraries differ?", a: "### Academic Libraries\nRoutines focus on supporting curriculum and research. Acquisitions are driven by faculty. Circulation allows long-term borrowing.\n\n### Public Libraries\nRoutines are geared towards community needs and recreation. Collection is broader (fiction, local interest). Circulation is high-volume with shorter loans.\n\n### Special Libraries\nRoutines are highly specialized. Acquisitions are on-demand. Dissemination is proactive to specific staff." },
      { q: "Why are standard operating procedures (SOPs) essential?", a: "### Consistency\nEnsures every user receives the same level of service.\n\n### Training\nServes as a tool for new staff.\n\n### Crisis Management\nProvides reference for complex situations." },
      { q: "Explain the library acquisition process.", a: "### 1. Needs Assessment\nAnalyzing user requests.\n### 2. Selection\nChoosing materials based on policy.\n### 3. Ordering\nPlacing orders with vendors.\n### 4. Receiving\nVerifying arrival.\n### 5. Processing\nStamping ownership." },
      { q: "Key factors in collection development policy?", a: "1. User Needs (Demographics)\n2. Budgetary Constraints\n3. Institutional Mission\n4. Format Selection\n5. Weeding Criteria" },
      { q: "Compare DDC and LCC systems.", a: "### DDC (Dewey)\nUsed in public libraries. Numerical (000-999). Hierarchical.\n\n### LCC (Library of Congress)\nUsed in academic libraries. Alphanumeric (A-Z). Enumerative. Better for large collections." },
      { q: "Fundamental elements of circulation policy?", a: "1. Patron Eligibility\n2. Loan Periods\n3. Renewal Limits\n4. Fines and Fees" },
      { q: "Advantages of Interlibrary Loan (ILL).", a: "Creates a 'library without walls'. Cost-effective. Fosters resource sharing." },
      { q: "Best practices for reference interview.", a: "Approachability, Open-ended questions, Active listening, Neutral questioning, Closure." },
      { q: "How libraries promote information literacy.", a: "Workshops, One-on-one instruction, LibGuides, Critical thinking advocacy." },
      { q: "Strategies for diverse community engagement.", a: "Needs assessment, Partnerships, Inclusive programming, Multilingual materials." },
      { q: "Library marketing strategies.", a: "Segmentation, Branding, Digital presence, Outreach events." },
      { q: "Preservation vs Conservation.", a: "Preservation: Proactive (Climate control).\nConservation: Reactive (Repairing torn pages)." },
      { q: "Best practices for digitization.", a: "High-res standards (TIFF), Copyright clearance, Robust metadata." },
      { q: "Challenges in digital preservation.", a: "Tech obsolescence, High cost, Link rot, DRM restrictions." },
      { q: "Considerations for library space design.", a: "Accessibility, Zoning (Quiet vs Loud), Flexibility, Power/WiFi access." }
    ]
  },
  {
    id: "irm103",
    code: "IRM 103",
    title: "Libraries and Societies",
    faculty: "IRM",
    level: "100L",
    price: 1000,
    questions: [
      { q: "Define a library and its primary functions.", a: "### Definition\nA social institution that collects, preserves, and disseminates information.\n\n### Functions\n1. Gateway to Information.\n2. Education Support.\n3. Cultural Preservation.\n4. Social Hub." },
      { q: "Historical development of libraries.", a: "### Ancient\nMesopotamia (Clay), Egypt (Papyrus).\n### Medieval\nMonasteries.\n### Renaissance\nPrinting press.\n### Modern\nPublic tax-supported libraries." },
      { q: "Relationship between libraries and education.", a: "Support formal education (exams), fight illiteracy, enable independent lifelong learning." },
      { q: "Public libraries and social inclusion.", a: "Provide free services to marginalized groups. Bridge the digital divide. Host community events." },
      { q: "Five major types of libraries.", a: "1. Public\n2. Academic\n3. School\n4. Special\n5. National" },
      { q: "Libraries and lifelong learning.", a: "Early literacy (Storytime), Adult education, Self-directed skill acquisition." },
      { q: "Impact of ICT on libraries.", a: "OPACs, Remote access (e-books), Virtual reference, Digitization, RFID automation." },
      { q: "Challenges of libraries in Nigeria.", a: "Funding, Infrastructure (Power), Staffing, Illiteracy, Maintenance." },
      { q: "Role of school libraries.", a: "Supplement textbooks, Teach research skills, Foster reading culture." },
      { q: "Libraries and democracy.", a: "Intellectual freedom, Fighting censorship, Privacy protection, Freedom of information." },
      { q: "Library as a social institution.", a: "Established by society to serve society. Preserves collective memory. Evolves with social needs." },
      { q: "Supporting persons with disabilities.", a: "Assistive tech (Screen readers), Braille books, Physical ramps, Outreach." },
      { q: "Ethical responsibilities.", a: "Confidentiality, Equitable access, Intellectual freedom, Professionalism." },
      { q: "Relevance of traditional libraries.", a: "Physical space for study, Digital divide bridge, Human guidance, Community hub." },
      { q: "Strategies for library awareness.", a: "Social media, School partnerships, Pop-up libraries, User advocacy groups." }
    ]
  },
  {
    id: "irm104",
    code: "IRM 104",
    title: "Introduction to Computer",
    faculty: "IRM",
    level: "100L",
    price: 1000,
    questions: [
      { q: "What is a computer? Discuss booting.", a: "### Computer\nElectronic device that accepts data, processes it, and produces output.\n### Booting\nLoading OS to RAM.\n### Restarting\nClearing RAM.\n### Shutdown\nCutting power safely." },
      { q: "Differentiate 3rd and 4th Gen computers.", a: "### 3rd Gen (1964-71)\nIntegrated Circuits (ICs). Keyboards.\n### 4th Gen (1971-Present)\nMicroprocessors (VLSI). CPU on one chip." },
      { q: "Drawbacks of 1st Gen computers.", a: "Massive size, Immense heat, Unreliable (Vacuum tubes), High power consumption, Machine language only." },
      { q: "Classifying computers.", a: "1. By Type (Analog, Digital, Hybrid)\n2. By Size (Super, Mainframe, Micro)\n3. By Purpose (General, Special)" },
      { q: "Categories of micro computers.", a: "Desktop, Laptop, Tablet, Smartphone." },
      { q: "Supercomputers vs Mainframes.", a: "Super: Calculation speed (Weather).\nMainframe: Bulk data processing (Banks)." },
      { q: "System Software vs Utility.", a: "OS (Windows) controls hardware. Utility (Antivirus) maintains system." },
      { q: "Functions of System Software.", a: "Process management, Memory management, File management, Security." },
      { q: "Hardware components.", a: "Input (Mouse), Output (Monitor), System Unit (CPU), Storage (HDD)." },
      { q: "Firmware vs Cache.", a: "Firmware: Low-level control (BIOS).\nCache: High-speed CPU memory." },
      { q: "Auxiliary Storage examples.", a: "HDD (Magnetic), SSD (Flash), Optical (CD/DVD)." },
      { q: "Computer Network factors.", a: "Resource sharing, Communication, Cost reduction, Data backup." },
      { q: "ROM vs RAM.", a: "RAM: Volatile, Read/Write.\nROM: Non-volatile, Read-only (BIOS)." },
      { q: "LAN vs WAN.", a: "LAN: Local area (Building).\nWAN: Wide area (Internet)." },
      { q: "Impact of computers in office.", a: "Speed, Efficiency, Reduced filing, Global communication, Better decisions." }
    ]
  },
  {
    id: "irm105",
    code: "IRM 105",
    title: "Data Modelling and Storage",
    faculty: "IRM",
    level: "100L",
    price: 1000,
    questions: [
      { q: "What is a data model? Criteria for storage?", a: "### Data Model\nConceptual representation of data structures (Entities, Attributes).\n### Criteria\nSpeed, Capacity, Security, Cost." },
      { q: "Explain Entity, Attribute, Primary Key.", a: "Entity: Object (Student).\nAttribute: Characteristic (Name).\nPrimary Key: Unique ID." },
      { q: "ERD vs Data Dictionary.", a: "ERD: Visual diagram.\nData Dictionary: Text-based schema description." },
      { q: "Master vs Transaction files.", a: "Master: Permanent records.\nTransaction: Temporary daily events." },
      { q: "Reasons for data modeling.", a: "Blueprint for coding, Communication, Consistency." },
      { q: "Hierarchical vs Network DB.", a: "Hierarchical: Tree (1 parent).\nNetwork: Flexible (Multiple parents)." },
      { q: "Evaluating data models.", a: "Simplicity, Expressiveness, Integrity, Shareability." },
      { q: "Database vs File.", a: "File: Flat, redundant.\nDatabase: Organized, secure, relational." },
      { q: "Multidimensional DB vs Object DB.", a: "Multidimensional: Data cubes (OLAP).\nObject: Stores data + methods." },
      { q: "Optimizing storage vs speed.", a: "Normalization saves space. Indexing speeds up access." },
      { q: "Strengths of Relational DB.", a: "Standard SQL, Flexible, Data integrity. Weakness: Slower with massive unstructured data." },
      { q: "Data Warehouse.", a: "Central repository for analysis (BI)." },
      { q: "Steps in building data model.", a: "Identify Entities -> Attributes -> Relationships -> Keys -> Normalize." },
      { q: "Example of Entity/Attribute.", a: "Entity: Car.\nAttribute: Color, Model, Plate Number." }
    ]
  },
  {
    id: "lis104",
    code: "LIS 104",
    title: "Information Architecture",
    faculty: "IRM",
    level: "100L",
    price: 1000,
    questions: [
      { q: "What is IA? Importance?", a: "Structural design of information environments. Organizing websites for usability. Prevents info overload." },
      { q: "IA vs UX vs IxD.", a: "UX: Emotional experience.\nIxD: Button behavior.\nIA: Structure/Map." },
      { q: "IA improves findability.", a: "Logical grouping + Clear labeling + Navigation = Reduced cognitive load." },
      { q: "Multidisciplinary nature of IA.", a: "Library Science (Cataloging), Psychology (Mental models), Architecture, CS." },
      { q: "Taxonomy vs Ontology.", a: "Taxonomy: Hierarchy (Parent/Child).\nOntology: Complex relationships." },
      { q: "Skills for IA.", a: "User research, Content audit, Wireframing, Analytical thinking." },
      { q: "Dan Brown's Principles.", a: "Object, Choice, Disclosure, Exemplar, Front Door." },
      { q: "IA Tools.", a: "OptimalSort (Card sorting), Figma (Wireframe), Google Analytics." },
      { q: "Content Strategy phases.", a: "Planning -> Creation -> Maintenance -> Governance." },
      { q: "Card Sorting.", a: "User research method to group topics logically." },
      { q: "Three Pillars of IA.", a: "Content, Users, Context." },
      { q: "Mobile IA challenges.", a: "Screen space, Touch targets. Solution: Prioritization, Hamburger menus." },
      { q: "Ethical considerations.", a: "Accessibility, Dark patterns, Bias, Privacy." },
      { q: "IA vs Content Strategy.", a: "IA = Structure (Skeleton). CS = Substance (Furniture)." },
      { q: "Steps to create IA.", a: "Research -> Audit -> Strategy -> Design -> Test." }
    ]
  }
];

export const faculties = ["IRM", "Engineering", "Sciences", "Arts"];
export const levels = ["100L", "200L", "300L", "400L"];

export function getCourseById(id: string): Course | undefined {
  return courses.find(course => course.id === id);
}

export function getCoursesByFacultyAndLevel(faculty: string, level: string): Course[] {
  return courses.filter(course => course.faculty === faculty && course.level === level);
}
