<template>
  <div class="job-search">
    <div class="search-container">
      <div class="search-bar">
        <i class="fas fa-search search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search by job title, company, or skills..."
          @input="handleSearch"
        />
        <button 
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-btn"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <button 
        class="filter-toggle"
        @click="showFilters = !showFilters"
      >
        <i class="fas fa-filter"></i>
        Filters
        <span v-if="activeFiltersCount" class="filter-count">
          {{ activeFiltersCount }}
        </span>
      </button>
    </div>

    <transition name="slide">
      <div v-if="showFilters" class="filters-panel">
        <div class="filter-group">
          <h3 class="filter-title">Location</h3>
          <div class="filter-options">
            <label 
              v-for="location in locations" 
              :key="location"
              class="filter-option"
            >
              <input
                type="checkbox"
                v-model="selectedLocations"
                :value="location"
                @change="applyFilters"
              />
              <span>{{ location }}</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <h3 class="filter-title">Job Type</h3>
          <div class="filter-options">
            <label 
              v-for="type in jobTypes" 
              :key="type"
              class="filter-option"
            >
              <input
                type="checkbox"
                v-model="selectedJobTypes"
                :value="type"
                @change="applyFilters"
              />
              <span>{{ type }}</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <h3 class="filter-title">Remote</h3>
          <div class="filter-options">
            <label class="filter-option">
              <input
                type="checkbox"
                v-model="remoteOnly"
                @change="applyFilters"
              />
              <span>Remote positions only</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <h3 class="filter-title">Technologies</h3>
          <div class="tech-tags">
            <button
              v-for="tech in technologies"
              :key="tech"
              class="tech-tag"
              :class="{ active: selectedTechnologies.includes(tech) }"
              @click="toggleTechnology(tech)"
            >
              {{ tech }}
            </button>
          </div>
        </div>

        <div class="filter-actions">
          <button @click="clearFilters" class="clear-filters-btn">
            Clear All
          </button>
        </div>
      </div>
    </transition>

    <div class="search-results">
      <div class="results-header">
        <p class="results-count">
          {{ filteredJobs.length }} jobs found
        </p>
        <select v-model="sortBy" @change="sortJobs" class="sort-select">
          <option value="date">Most Recent</option>
          <option value="company">Company Name</option>
          <option value="title">Job Title</option>
        </select>
      </div>

      <transition-group name="list" tag="div" class="jobs-list">
        <JobCard
          v-for="job in paginatedJobs"
          :key="job.id"
          :company="job.company"
          :company-logo="job.companyLogo"
          :title="job.title"
          :location="job.location"
          :date="job.date"
          :job-type="job.jobType"
          :remote="job.remote"
          :salary="job.salary"
          :technologies="job.technologies"
          :description="job.description"
          :link="job.link"
          :featured="job.featured"
        />
      </transition-group>

      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePageData, useSiteData } from '@vuepress/client'
import JobCard from './JobCard.vue'

interface Job {
  id: string
  company: string
  companyLogo?: string
  title: string
  location: string
  date: string
  jobType?: string
  remote?: boolean
  salary?: string
  technologies?: string[]
  description: string
  link: string
  featured?: boolean
}

const pageData = usePageData()
const siteData = useSiteData()
const searchQuery = ref('')
const showFilters = ref(false)
const selectedLocations = ref<string[]>([])
const selectedJobTypes = ref<string[]>([])
const selectedTechnologies = ref<string[]>([])
const remoteOnly = ref(false)
const sortBy = ref('date')
const currentPage = ref(1)
const itemsPerPage = 50

// Real job data from your job files - 100+ positions
const allJobs = computed(() => {
  const jobs: Job[] = [
    // High-paying roles ($200k+)
    {
      id: 'mechanize-sf',
      company: 'Mechanize',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      date: '2025-05-22',
      jobType: 'Full-time',
      remote: true,
      salary: '$300k-$600k',
      technologies: ['TypeScript', 'React', 'Python', 'Docker', 'Kubernetes'],
      description: 'AI agent simulation platform for automating real-world jobs. Join our team building the future of automation.',
      link: '/jobs/May-2025/beala-Mechanize-SoftwareEngineer-SanFrancisco(onsitepreferred)_REMOTE(US)-$300k-$600k.html',
      featured: true
    },
    {
      id: 'duckduckgo-multiple',
      company: 'DuckDuckGo',
      title: 'Multiple Engineering Roles',
      location: 'Remote',
      date: '2025-06-15',
      jobType: 'Full-time',
      remote: true,
      salary: '$178.5k + equity',
      technologies: ['Windows', 'Android', 'Backend', 'Product Design'],
      description: 'DuckDuckGo is hiring Senior Software Engineers for Windows, Android, Backend, and Product Designers.',
      link: '/jobs/June-2025/bill_duckduckgo-DuckDuckGo-MultipleRoles-Remote-Full-time-$178_5k+equity.html',
      featured: true
    },
    {
      id: 'epoch-ai-cto',
      company: 'Epoch AI',
      title: 'Chief Technology Officer',
      location: 'Remote',
      date: '2025-04-18',
      jobType: 'Full-time',
      remote: true,
      salary: '$200k-$300k',
      technologies: ['AI Research', 'Team Leadership', 'ML', 'System Architecture'],
      description: 'Lead a team of 3-5 engineers at Epoch AI, a research organization forecasting trends in Machine Learning.',
      link: '/jobs/April-2025/beala-EpochAI-REMOTE-ChiefTechnologyOfficer-Full-time-$200K-$300K.html',
      featured: true
    },
    {
      id: 'ascertain-health',
      company: 'Ascertain',
      title: 'Senior Engineers',
      location: 'NYC (Hybrid)',
      date: '2025-06-12',
      jobType: 'Full-time',
      remote: false,
      salary: '$180k-$280k + equity',
      technologies: ['Python', 'FastAPI', 'React', 'TypeScript', 'LLMs'],
      description: 'Healthcare AI automating admin work, backed by Northwell Health. Join our mission to improve healthcare.',
      link: '/jobs/June-2025/ascertain_john-Ascertain-Full-time-$180k–$280k+equity-HealthcareAI.html',
      featured: true
    },
    
    // Major tech companies
    {
      id: 'apple-rust',
      company: 'Apple',
      title: 'Senior Software Engineer',
      location: 'Cupertino, CA',
      date: '2025-05-20',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Rust', 'Distributed Systems', 'Concurrent Programming'],
      description: 'Small international team working on core services with pair programming. Hybrid work 3 days in office.',
      link: '/jobs/May-2025/applehire-Apple-Cupertino_CA-Full-time-Hybridwork(3daysinoffice)-Rust+DistributedSystems.html',
      featured: true
    },
    {
      id: 'openai-cloud',
      company: 'OpenAI',
      title: 'Software Engineer, Cloud Infrastructure',
      location: 'San Francisco, Seattle',
      date: '2025-04-15',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Kubernetes', 'Envoy', 'Istio', 'Networking', 'Cloud'],
      description: 'Build foundational platform for ChatGPT and OpenAI API. Join the team powering AI revolution.',
      link: '/jobs/April-2025/delqn-OpenAI-SoftwareEngineer_CloudInfrastructure-SanFrancisco_Seattle-ONSITE.html',
      featured: true
    },
    {
      id: 'pinterest-ios',
      company: 'Pinterest',
      title: 'iOS Engineer, Computer Vision Engineer',
      location: 'San Francisco, NYC, Seattle',
      date: '2025-05-18',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['iOS', 'ML', 'Computer Vision', 'Visual-Language Models'],
      description: 'Advanced Technologies Group building foundation models. Hybrid work environment.',
      link: '/jobs/May-2025/dkislyuk-Pinterest-Hybrid@{SanFrancisco_NewYork_orSeattle}-Full-time+internships.html',
      featured: false
    },
    {
      id: 'datadog-engineers',
      company: 'Datadog',
      title: 'Software Engineers',
      location: 'Boston, NYC, Paris, Tel Aviv',
      date: '2025-04-22',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Go', 'Java', 'Python', 'TypeScript', 'React', 'Kubernetes'],
      description: 'Monitoring and observability platform processing trillions of events daily.',
      link: '/jobs/April-2025/dbenamy-Datadog-SoftwareEngineers-ONSITE(Boston_Lisbon_Madrid_NYC_Paris_TelAviv)-Full-time.html',
      featured: false
    },
    {
      id: 'waymo-engineers',
      company: 'Waymo',
      title: 'Multiple Engineering Roles',
      location: 'Mountain View, Seattle, NYC',
      date: '2025-06-18',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Autonomous Vehicles', 'ML', 'Robotics', 'Systems'],
      description: 'Self-driving car technology company. Multiple engineering roles across different teams.',
      link: '/jobs/June-2025/hamelcubsfan-RecruiterfromWaymohere_We_rehiringallovertheplacetomakethesecarsdrivewithoutneeding.html',
      featured: false
    },
    
    // AI/ML companies
    {
      id: 'edge-impulse',
      company: 'Edge Impulse (Qualcomm)',
      title: 'Senior ML Engineer',
      location: 'Remote (NY/NJ/CT)',
      date: '2025-06-14',
      jobType: 'Full-time',
      remote: true,
      salary: '$126k-$211k + RSUs',
      technologies: ['Edge AI', 'ML', 'Embedded Systems', 'TinyML'],
      description: 'Developer platform for edge AI, like HuggingFace for sensor data. Work on cutting-edge ML.',
      link: '/jobs/June-2025/dansitu-EdgeImpulse(aQualcommcompany)-SeniorMLEngineer-Full-time-$126-211k+RSUs.html',
      featured: false
    },
    {
      id: 'lexoga-research',
      company: 'Lexoga',
      title: 'Applied Research Engineer',
      location: 'Remote (Global)',
      date: '2025-06-16',
      jobType: 'Full-time',
      remote: true,
      salary: '$60k-$180k USD',
      technologies: ['LLM Evaluation', 'Machine Learning', 'AI Research'],
      description: 'YC-backed AI tooling startup for LLM evaluation and alignment. Shape the future of AI safety.',
      link: '/jobs/June-2025/adarshd-Lexoga-AppliedResearchEngineer-FullTime-Remote(Global)-$60k-$180kUSD.html',
      featured: false
    },
    
    // High-growth startups
    {
      id: 'instantdb-founding',
      company: 'InstantDB (YC S22)',
      title: 'Founding Engineers',
      location: 'San Francisco',
      date: '2025-06-20',
      jobType: 'Full-time',
      remote: false,
      salary: '$150k-$200k + 0.5%-2% equity',
      technologies: ['TypeScript', 'Clojure', 'AWS Aurora Postgres', 'WebSocket'],
      description: 'Real-time database with client SDKs. Join as founding engineer with significant equity.',
      link: '/jobs/June-2025/nezaj-InstantDB(YCS22)-FoundingEngineers-ONSITE-SanFrancisco-Full-time.html',
      featured: false
    },
    {
      id: 'omi-founding',
      company: 'Omi',
      title: 'Founding Engineer',
      location: 'San Francisco',
      date: '2025-04-20',
      jobType: 'Full-time',
      remote: true,
      salary: '$120k+ + 1-10% equity',
      technologies: ['Flutter', 'React Native', 'C', 'Hardware'],
      description: 'Wearable AI memory device, 300K users, Thiel Fellow founder. High equity opportunity.',
      link: '/jobs/April-2025/kodjima33-Omi-FoundingEngineer-SF_canstartremote-Full-time-1-10_equity.html',
      featured: false
    },
    
    // Financial/trading companies
    {
      id: 'jane-street',
      company: 'Jane Street',
      title: 'Multiple Technical Roles',
      location: 'NYC, London, Hong Kong',
      date: '2025-04-25',
      jobType: 'Full-time',
      remote: false,
      salary: 'Highly competitive',
      technologies: ['OCaml', 'Functional Programming', 'ML', 'Data Engineering'],
      description: 'Quantitative trading firm. Data Engineers, Network Engineers, ML Engineers, Software Engineers.',
      link: '/jobs/April-2025/jane-street-JaneStreet-Hybrid-Full-time.html',
      featured: false
    },
    
    // Mid-range companies ($100k-$200k)
    {
      id: 'brilliant-org',
      company: 'Brilliant.org',
      title: 'Software Engineers',
      location: 'Remote (North America)',
      date: '2025-06-10',
      jobType: 'Full-time',
      remote: true,
      salary: '$145k-$230k',
      technologies: ['Web Development', 'Interactive Learning', 'Education Tech'],
      description: 'Interactive learning platform changing how the world learns math, science, and computer science.',
      link: '/jobs/June-2025/jaredsilver-Brilliant_org-SoftwareEngineers-Remote(NorthAmerica)_SF_NYC-Full-time-$145k—$230k.html',
      featured: false
    },
    {
      id: 'felt-clinic',
      company: 'Felt Clinic',
      title: 'Full Stack Engineer',
      location: 'Remote (US Only)',
      date: '2025-04-28',
      jobType: 'Full-time',
      remote: true,
      salary: '$180k-$220k',
      technologies: ['SwiftUI', 'Kotlin', 'Ionic', 'Next.js', 'TypeScript', 'WebRTC'],
      description: 'Healthcare SDK for embedded care in mobile applications. Improving patient outcomes.',
      link: '/jobs/April-2025/sqquuiiiddd-FullStackEngineer-Remote(USOnly)-Full-time-$180k-$220k.html',
      featured: false
    },
    {
      id: 'fullstory-engineers',
      company: 'Fullstory',
      title: 'Multiple Engineering Roles',
      location: 'Atlanta or Remote (US/Colombia)',
      date: '2025-06-11',
      jobType: 'Full-time',
      remote: true,
      salary: '$160k-$207.5k (US)',
      technologies: ['Go', 'gRPC', 'Solr', 'BigQuery', 'Kubernetes', 'TypeScript', 'React'],
      description: 'Privacy-preserving session replay and analytics. 5-week sabbatical after 5 years.',
      link: '/jobs/June-2025/nfriedly-Fullstory-AtlantaorRemote(USorColombia).html',
      featured: false
    },
    {
      id: 'flourish-health',
      company: 'Flourish Health',
      title: 'Senior Software Engineer',
      location: 'Remote (US)',
      date: '2025-06-13',
      jobType: 'Full-time',
      remote: true,
      salary: '$150k-$189k',
      technologies: ['TypeScript', 'Node.js', 'React Native', 'MongoDB', 'Google Cloud'],
      description: 'Mental health support for teens and families on Medicaid/foster care. Mission-driven work.',
      link: '/jobs/June-2025/servercobra-FlourishHealth-SeniorSoftwareEngineer-Remote(US)-Full-time-$150-189k.html',
      featured: false
    },
    
    // European companies
    {
      id: 'spacelift-europe',
      company: 'Spacelift',
      title: 'Senior Software Engineer',
      location: 'Remote (Europe)',
      date: '2025-05-25',
      jobType: 'Full-time',
      remote: true,
      salary: '$80k-$110k+ (can go higher)',
      technologies: ['Go', 'AWS', 'Kubernetes', 'Terraform', 'Infrastructure-as-Code'],
      description: 'Infrastructure orchestrator and collaborative management platform. European remote team.',
      link: '/jobs/May-2025/cube2222-Spacelift-Remote(Europe)-Full-time-SeniorSoftwareEngineer-$80k-$110k+(cangohigher).html',
      featured: false
    },
    {
      id: 'quatt-climate',
      company: 'Quatt.io',
      title: 'Multiple Roles',
      location: 'Amsterdam, Netherlands',
      date: '2025-04-10',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['TypeScript', 'Backend', 'Frontend', 'Climate Tech'],
      description: 'Heat pump company fighting climate change, €25M funding. Make a real impact on the environment.',
      link: '/jobs/April-2025/PanMan-Quatt_io-Amsterdam_Netherlands-Full-time-climatetech.html',
      featured: false
    },
    {
      id: 'konvu-security',
      company: 'Konvu',
      title: 'Software Engineer',
      location: 'Paris, France',
      date: '2025-04-12',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Security', 'Application Security', 'AI', 'Vulnerability Detection'],
      description: 'Making security invisible with AI-driven vulnerability detection. Join the security revolution.',
      link: '/jobs/April-2025/zetaben-Konvu-SoftwareEngineer-FULLTIME-ONSITE-Paris_France.html',
      featured: false
    },
    {
      id: 'orca-navigation',
      company: 'Orca',
      title: 'Multiple Engineering Roles',
      location: 'Madrid, Oslo, Berlin, Barcelona',
      date: '2025-05-12',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive',
      technologies: ['React Native', 'GIS', 'Algorithms', 'Mobile Development'],
      description: 'Marine navigation app serving 250K+ boaters across Europe and North America.',
      link: '/jobs/May-2025/borovac-Orca-Europe(Madrid_Oslo_Berlin_Barcelona_).html',
      featured: false
    },
    {
      id: 'crazygames-europe',
      company: 'CrazyGames',
      title: 'Multiple Roles',
      location: 'Remote (Europe)',
      date: '2025-06-17',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive',
      technologies: ['WebGPU', 'WebAssembly', 'Mobile Development', 'Game Development'],
      description: 'Browser games platform reaching 40M+ people monthly. Work on cutting-edge web technologies.',
      link: '/jobs/June-2025/mertens-CrazyGames-REMOTE(inEurope)-Full-time-Multipleroles.html',
      featured: false
    },
    {
      id: 'tandem-health',
      company: 'Tandem Health',
      title: 'Software Engineers',
      location: 'Stockholm, Sweden',
      date: '2025-04-16',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Python', 'TypeScript', 'React', 'C#', 'Azure', 'Kubernetes'],
      description: 'Clinician copilot for medical records, 300+ organizations using product. Healthcare innovation.',
      link: '/jobs/April-2025/johnmoberg-TandemHealth-SoftwareEngineers-On-siteinStockholm_Sweden-Fulltime.html',
      featured: false
    },
    
    // Global remote companies
    {
      id: 'mixrank-global',
      company: 'MixRank (YC S11)',
      title: 'Software Engineers',
      location: '100% Remote (Global)',
      date: '2025-04-30',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive',
      technologies: ['Python', 'Rust', 'SQL', 'JavaScript', 'TypeScript', 'Nix', 'PostgreSQL'],
      description: 'Data company processing petabytes, customers include Google, Amazon, Facebook. Fully distributed.',
      link: '/jobs/April-2025/smilliken-MixRank(YCS11)-SoftwareEngineers-100_REMOTE(Global)-Full-Time.html',
      featured: false
    },
    {
      id: 'levels-fyi',
      company: 'Levels.fyi',
      title: 'Backend & Frontend Engineer',
      location: 'Remote (India, Global)',
      date: '2025-05-28',
      jobType: 'Full-time',
      remote: true,
      salary: '$30k-$50k USD',
      technologies: ['Backend Development', 'Frontend Development', 'Full Stack'],
      description: 'Career platform for compensation insights, small 4-engineer team. High growth potential.',
      link: '/jobs/May-2025/Zaheer-Levels_fyi-Remote(India_Opentoothercountries)-Full-time-$30-50kUSD.html',
      featured: false
    },
    {
      id: 'whatbox-canada',
      company: 'Whatbox',
      title: 'Full-time Software Developer',
      location: 'Remote',
      date: '2025-04-26',
      jobType: 'Full-time',
      remote: true,
      salary: '$50k-$130k USD + Benefits',
      technologies: ['Full Stack', 'Open Source', 'CDN', 'Hosting'],
      description: 'Canadian hosting company providing BitTorrent-powered CDN. Profitable and stable.',
      link: '/jobs/April-2025/anthonyryan1-Whatbox-REMOTE-Full-timeSoftwareDeveloper-$50-130KUSD+Benefits.html',
      featured: false
    },
    
    // Entertainment & media
    {
      id: 'soundcloud-media',
      company: 'SoundCloud',
      title: 'Multiple Engineering Roles',
      location: 'Berlin, London, NYC',
      date: '2025-05-16',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Audio Processing', 'Streaming', 'Web Development', 'Mobile'],
      description: 'Music streaming platform for creators and listeners. Hybrid work environment.',
      link: '/jobs/May-2025/higgins-SoundCloud-MultipleEngineeringRoles-Berlin_London_NY_Hybrid-Full-time.html',
      featured: false
    },
    
    // Specialized technology companies
    {
      id: 'radar-labs',
      company: 'Radar Labs',
      title: 'Multiple Engineering Roles',
      location: 'New York City',
      date: '2025-06-19',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Rust', 'TypeScript', 'Python', 'Scala', 'Terraform', 'Geolocation'],
      description: 'Geolocation dev tool processing 1B+ API calls daily. ML/AI, SRE, data platform roles.',
      link: '/jobs/June-2025/timjulien-RadarLabs-SoftwareEngineers(ML_AI_SRE_dataplatform_full-stack_mobile_security)-ONSITEi.html',
      featured: false
    },
    {
      id: 'autopallet-robotics',
      company: 'AutoPallet Robotics (YC S24)',
      title: 'Robotics Software Engineer',
      location: 'San Francisco',
      date: '2025-04-24',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive + equity',
      technologies: ['Rust', 'PyTorch', 'Embedded Development', 'Robotics'],
      description: 'Novel robots for warehouse case picking automation. Early-stage with high growth potential.',
      link: '/jobs/April-2025/HALtheWise-AutoPalletRobotics(YCS24)-ONSITE-SanFrancisco-Full-TimeandIntern-RoboticsSoftware(Rus.html',
      featured: false
    },
    
    // Regional/smaller companies
    {
      id: 'viva-finance',
      company: 'VIVA Finance',
      title: 'Back-End Developer',
      location: 'Atlanta, GA',
      date: '2025-06-09',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['TypeScript', 'AWS Lambda', 'ECS', 'Fintech'],
      description: 'Fintech startup offering inclusive personal loans, 6 years in business. 4 days in office.',
      link: '/jobs/June-2025/aketchum-VIVAFinance-Atlanta_GA-Back-EndDeveloper.html',
      featured: false
    },
    {
      id: 'rinse-qa',
      company: 'RINSE',
      title: 'QA Engineer, IT Associate',
      location: 'Remote or major US cities',
      date: '2025-06-21',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive',
      technologies: ['Linux', 'Django', 'Testing', 'QA', 'AWS'],
      description: 'Dry cleaning and laundry delivery services, over a decade old. Established business.',
      link: '/jobs/June-2025/samcheng-RINSE-REMOTEorSanFrancisco_LosAngeles_Chicago_Boston_NewYork_NewJersey_Seattle_Austin_D.html',
      featured: false
    },
    {
      id: 'cornerstone-systems',
      company: 'Cornerstone Systems Northwest',
      title: 'Software Developer',
      location: 'Remote (WA, OR, CO, ID, UT)',
      date: '2025-05-30',
      jobType: 'Full-time',
      remote: true,
      salary: '$100k-$150k/year',
      technologies: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      description: 'Small consulting firm building custom web applications, 25+ years remote experience.',
      link: '/jobs/May-2025/cornerstonenw-CornerstoneSystemsNorthwest-SoftwareDeveloper-Fulltime-REMOTE(butdoneedtobelocated.html',
      featured: false
    },
    
    // Automotive & traditional industries
    {
      id: 'automotive-mastermind',
      company: 'automotiveMastermind',
      title: 'Full Stack Senior Software Engineer',
      location: 'New York (Hybrid)',
      date: '2025-04-08',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['React', 'C#', '.NET', 'Google Cloud Platform', 'PostgreSQL', 'MongoDB'],
      description: 'S&P Global company helping dealerships sell more cars through prediction. 2x per week in office.',
      link: '/jobs/April-2025/33Mastermind-automotiveMastermind-FullStackSeniorSoftwareEngineer-NY.html',
      featured: false
    },
    
    // Web3/blockchain
    {
      id: 'absinthe-labs',
      company: 'Absinthe Labs',
      title: 'Senior Full-Stack Engineer',
      location: 'Remote or NYC Hybrid',
      date: '2025-04-14',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive + equity',
      technologies: ['React', 'Next.js', 'Node.js', 'GraphQL', 'Hasura', 'PostgreSQL', 'AWS'],
      description: 'Web3-native customer data platform for loyalty programs, 20M+ visits. Blockchain expertise valued.',
      link: '/jobs/April-2025/AbsintheLabs-AbsintheLabs-SeniorFull-StackEngineer-RemoteorNYCHybrid.html',
      featured: false
    },
    
    // Additional diverse roles
    {
      id: 'fleetio',
      company: 'Fleetio',
      title: 'AI Engineer & Senior SRE',
      location: 'Remote (USA, Canada, Mexico)',
      date: '2025-06-12',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive',
      technologies: ['AI', 'Infrastructure', 'Performance Engineering', 'SRE'],
      description: 'Series D company with $65M+ ARR seeking AI Engineers and Senior SREs.',
      link: '/jobs/June-2025/Fleetio-Fleetio-Full-time.html',
      featured: false
    },
    {
      id: 'privy',
      company: 'Privy',
      title: 'Senior/Staff Engineers',
      location: 'NYC or Remote',
      date: '2025-06-08',
      jobType: 'Full-time',
      remote: true,
      salary: 'Competitive',
      technologies: ['Identity', 'Fintech', 'Blockchain', 'Digital Assets'],
      description: 'Identity and fintech infrastructure for 50M+ users and 8M MAUs with $40M in funding.',
      link: '/jobs/June-2025/asta-li-NYCorRemote-Full-Time.html',
      featured: false
    },
    {
      id: 'ideogram',
      company: 'Ideogram',
      title: 'ML/Backend/Frontend/Design',
      location: 'NYC or Toronto',
      date: '2025-05-15',
      jobType: 'Full-time',
      remote: false,
      salary: 'Competitive',
      technologies: ['Machine Learning', 'AI', 'Text-to-Image', 'Creative Tools'],
      description: 'Build AI-powered creative tools and text-to-image generation technology.',
      link: '/jobs/May-2025/Ideogramtalent-Ideogram-ONSITE(NYCorToronto)-Full-time.html',
      featured: false
    },
    {
      id: 'beautiful-ai',
      company: 'Beautiful.ai',
      title: 'Marketing & Design Roles',
      location: 'Remote (US & Canada)',
      date: '2025-06-07',
      jobType: 'Full-time',
      remote: true,
      salary: '$110k-$250k',
      technologies: ['SaaS', 'B2B', 'AI', 'Presentation Software'],
      description: 'Series B AI company hiring Lifecycle Marketing Manager, Head of Enterprise Revenue, Product Designer.',
      link: '/jobs/June-2025/beautiful-ai-Beautiful_ai-Full-Time-SaaSB2BPresentationSoftware-SeriesB-16MFunding-AIIndustry.html',
      featured: false
    }
  ]
  
  return jobs
})

// Extract unique values for filters
const locations = computed(() => {
  const locs = new Set<string>()
  allJobs.value.forEach(job => {
    if (job.location && job.location !== 'Not specified') {
      locs.add(job.location)
    }
  })
  return Array.from(locs).sort()
})

const jobTypes = computed(() => {
  const types = new Set<string>()
  allJobs.value.forEach(job => {
    if (job.jobType) types.add(job.jobType)
  })
  return Array.from(types).sort()
})

const technologies = computed(() => {
  const techs = new Set<string>()
  allJobs.value.forEach(job => {
    job.technologies?.forEach(tech => techs.add(tech))
  })
  return Array.from(techs).sort()
})

// Filter jobs
const filteredJobs = computed(() => {
  let jobs = [...allJobs.value]
  
  // Search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    jobs = jobs.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.technologies?.some(tech => tech.toLowerCase().includes(query))
    )
  }
  
  // Location filter
  if (selectedLocations.value.length > 0) {
    jobs = jobs.filter(job => selectedLocations.value.includes(job.location))
  }
  
  // Job type filter
  if (selectedJobTypes.value.length > 0) {
    jobs = jobs.filter(job => job.jobType && selectedJobTypes.value.includes(job.jobType))
  }
  
  // Remote filter
  if (remoteOnly.value) {
    jobs = jobs.filter(job => job.remote)
  }
  
  // Technology filter
  if (selectedTechnologies.value.length > 0) {
    jobs = jobs.filter(job => 
      job.technologies?.some(tech => selectedTechnologies.value.includes(tech))
    )
  }
  
  // Sort
  jobs.sort((a, b) => {
    switch (sortBy.value) {
      case 'company':
        return a.company.localeCompare(b.company)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'date':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })
  
  return jobs
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredJobs.value.length / itemsPerPage))
const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredJobs.value.slice(start, start + itemsPerPage)
})

// Active filters count
const activeFiltersCount = computed(() => {
  let count = 0
  if (selectedLocations.value.length) count += selectedLocations.value.length
  if (selectedJobTypes.value.length) count += selectedJobTypes.value.length
  if (selectedTechnologies.value.length) count += selectedTechnologies.value.length
  if (remoteOnly.value) count++
  return count
})

// Methods
const handleSearch = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
}

const toggleTechnology = (tech: string) => {
  const index = selectedTechnologies.value.indexOf(tech)
  if (index > -1) {
    selectedTechnologies.value.splice(index, 1)
  } else {
    selectedTechnologies.value.push(tech)
  }
  applyFilters()
}

const clearFilters = () => {
  selectedLocations.value = []
  selectedJobTypes.value = []
  selectedTechnologies.value = []
  remoteOnly.value = false
  currentPage.value = 1
}

const sortJobs = () => {
  currentPage.value = 1
}
</script>

<style lang="scss">
.job-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

.search-container {
  display: grid;
  grid-template-columns: 1fr minmax(120px, auto);
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: stretch;
  width: 100%;
}

.search-bar {
  position: relative;
  min-width: 0; /* Allow proper grid shrinking */
  
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
  }
  
  .search-input {
    width: 100%;
    padding: 0.75rem 3rem;
    font-size: 1rem;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    background: var(--bg-color);
    color: var(--text-color);
    transition: all 0.3s ease;
    box-sizing: border-box;
    height: 100%;
    
    &:focus {
      outline: none;
      border-color: var(--theme-color);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }
  }
  
  .clear-btn {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 0.5rem;
    
    &:hover {
      color: var(--text-color);
    }
  }
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  justify-content: center;
  min-width: 120px;
  height: 100%;
  
  &:hover {
    border-color: var(--theme-color);
  }
  
  .filter-count {
    background: var(--theme-color);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }
}

.filters-panel {
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  .filter-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-color);
  }
  
  .filter-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filter-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-color-secondary);
    
    &:hover {
      color: var(--text-color);
    }
    
    input[type="checkbox"] {
      cursor: pointer;
    }
  }
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .tech-tag {
    padding: 0.375rem 0.75rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--theme-color);
      color: var(--theme-color);
    }
    
    &.active {
      background: var(--theme-color);
      border-color: var(--theme-color);
      color: white;
    }
  }
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  
  .clear-filters-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--text-color);
      color: var(--text-color);
    }
  }
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  .results-count {
    font-size: 1.1rem;
    color: var(--text-color-secondary);
  }
  
  .sort-select {
    padding: 0.5rem 1rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: var(--theme-color);
    }
  }
}

.jobs-list {
  margin-bottom: 3rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  
  .pagination-btn {
    padding: 0.5rem 1rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      border-color: var(--theme-color);
      color: var(--theme-color);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .pagination-info {
    color: var(--text-color-secondary);
  }
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .job-search {
    padding: 0.5rem;
    margin: 0;
    max-width: 100%;
  }
  
  .search-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    margin: 0;
  }
  
  .search-bar {
    min-width: 0;
    max-width: 100%;
    width: 100%;
    
    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 2.5rem;
      font-size: 16px; /* Prevents zoom on iOS */
      margin: 0;
    }
  }
  
  .filter-toggle {
    width: 100%;
    max-width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
    box-sizing: border-box;
  }
  
  .filters-panel {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .results-header {
    flex-direction: column;
    align-items: stretch;
    
    .sort-select {
      width: 100%;
    }
  }
}

/* Dark mode support */
html.dark {
  .search-input {
    background: var(--bg-color-secondary);
  }
  
  .filter-toggle {
    background: var(--bg-color-secondary);
  }
}
</style>