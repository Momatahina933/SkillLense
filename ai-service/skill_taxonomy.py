"""
Canonical skill taxonomy and alias map for skill normalisation.
"""

SKILL_TAXONOMY: list[str] = [
    # Programming Languages
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "C++",
    "C#",
    "Go",
    "Rust",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
    "Scala",
    "R",
    "C",
    "Dart",
    "Elixir",
    "Haskell",
    "Lua",
    "Perl",
    # Web Frameworks
    "React",
    "Vue.js",
    "Angular",
    "Next.js",
    "Nuxt.js",
    "Express.js",
    "Django",
    "Flask",
    "FastAPI",
    "Spring Boot",
    "Laravel",
    "Rails",
    "Svelte",
    "Remix",
    "Nest.js",
    "Fastify",
    "Gin",
    "Echo",
    "Fiber",
    # Databases
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "SQLite",
    "Elasticsearch",
    "Cassandra",
    "DynamoDB",
    "MariaDB",
    "Oracle",
    "Microsoft SQL Server",
    "CouchDB",
    "Neo4j",
    "InfluxDB",
    # Cloud & DevOps
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Terraform",
    "CI/CD",
    "Jenkins",
    "GitHub Actions",
    "Ansible",
    "Helm",
    "Prometheus",
    "Grafana",
    "Nginx",
    "Linux",
    "Bash",
    # Data & ML
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "scikit-learn",
    "Pandas",
    "NumPy",
    "Data Analysis",
    "NLP",
    "Computer Vision",
    "Keras",
    "XGBoost",
    "Apache Spark",
    "Hadoop",
    "Tableau",
    "Power BI",
    "dbt",
    "Airflow",
    # Tools & Practices
    "Git",
    "REST API",
    "GraphQL",
    "Microservices",
    "Agile",
    "Scrum",
    "SQL",
    "Node.js",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "WebSockets",
    "gRPC",
    "RabbitMQ",
    "Kafka",
    "Celery",
    "OAuth",
    "JWT",
]

# Maps lowercase aliases to canonical taxonomy names
ALIAS_MAP: dict[str, str] = {
    # JavaScript / TypeScript
    "js": "JavaScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "ecmascript": "JavaScript",
    "es6": "JavaScript",
    "es2015": "JavaScript",
    # Python
    "py": "Python",
    "python3": "Python",
    "python2": "Python",
    # React
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",
    # Vue
    "vuejs": "Vue.js",
    "vue": "Vue.js",
    "vue js": "Vue.js",
    # Angular
    "angularjs": "Angular",
    "angular.js": "Angular",
    "angular js": "Angular",
    # Next / Nuxt
    "nextjs": "Next.js",
    "next js": "Next.js",
    "nuxtjs": "Nuxt.js",
    "nuxt js": "Nuxt.js",
    # Express
    "express": "Express.js",
    "expressjs": "Express.js",
    "express js": "Express.js",
    # Nest
    "nestjs": "Nest.js",
    "nest js": "Nest.js",
    # Node.js
    "nodejs": "Node.js",
    "node": "Node.js",
    "node js": "Node.js",
    # Spring
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring-boot": "Spring Boot",
    # Rails
    "ruby on rails": "Rails",
    "ror": "Rails",
    # PostgreSQL
    "postgres": "PostgreSQL",
    "pg": "PostgreSQL",
    "postgresql": "PostgreSQL",
    # MySQL
    "mysql": "MySQL",
    # MongoDB
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    # Redis
    "redis": "Redis",
    # Elasticsearch
    "elastic": "Elasticsearch",
    "elastic search": "Elasticsearch",
    # Kubernetes
    "k8s": "Kubernetes",
    "kube": "Kubernetes",
    # Docker
    "docker": "Docker",
    # Terraform
    "tf": "Terraform",
    # Cloud
    "amazon web services": "AWS",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "microsoft azure": "Azure",
    # Machine Learning
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    # Deep Learning
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    # TensorFlow
    "tensorflow": "TensorFlow",
    # scikit-learn
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    # PyTorch
    "pytorch": "PyTorch",
    # NLP
    "natural language processing": "NLP",
    # Computer Vision
    "cv": "Computer Vision",
    # SQL
    "sql": "SQL",
    # HTML / CSS
    "html5": "HTML",
    "css3": "CSS",
    "tailwind": "Tailwind CSS",
    # Git
    "github": "Git",
    "gitlab": "Git",
    # REST
    "rest": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    # CI/CD
    "cicd": "CI/CD",
    "ci cd": "CI/CD",
    "continuous integration": "CI/CD",
    "continuous deployment": "CI/CD",
    # Agile / Scrum
    "agile methodology": "Agile",
    "scrum methodology": "Scrum",
    # Bash
    "shell": "Bash",
    "shell scripting": "Bash",
    # Pandas / NumPy
    "pandas": "Pandas",
    "numpy": "NumPy",
}
