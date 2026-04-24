"""
Training data generation for SkillLens ML models.

Generates synthetic but realistic CV section and skill classification data
based on the project's skill taxonomy.
"""

from __future__ import annotations

import random
from skill_taxonomy import SKILL_TAXONOMY, ALIAS_MAP

# ── Section classification training data ─────────────────────────────────────

SECTION_SAMPLES: dict[str, list[str]] = {
    "skills": [
        "Python, JavaScript, React, Node.js, PostgreSQL",
        "Technical Skills: Java, Spring Boot, Docker, Kubernetes",
        "Core Competencies: Machine Learning, TensorFlow, PyTorch, scikit-learn",
        "Technologies: AWS, Azure, GCP, Terraform, CI/CD",
        "Programming Languages: Python, TypeScript, Go, Rust",
        "Frameworks: Django, Flask, FastAPI, Express.js, Next.js",
        "Databases: PostgreSQL, MongoDB, Redis, Elasticsearch",
        "Tools: Git, Docker, Jenkins, GitHub Actions, Ansible",
        "Skills: HTML, CSS, Tailwind CSS, React, Vue.js, Angular",
        "Data: Pandas, NumPy, Tableau, Power BI, Apache Spark",
        "Proficient in Python, R, SQL, and data visualisation tools",
        "Strong knowledge of REST API design and GraphQL",
        "Experience with Agile and Scrum methodologies",
        "Cloud platforms: AWS (EC2, S3, Lambda), Azure, GCP",
        "DevOps: Docker, Kubernetes, Terraform, Helm, Prometheus",
        "NLP, Computer Vision, Deep Learning, Keras, XGBoost",
        "Microservices architecture, RabbitMQ, Kafka, gRPC",
        "OAuth, JWT, WebSockets, Node.js, Nest.js",
        "Linux, Bash scripting, Nginx, CI/CD pipelines",
        "Proficient: Python | Intermediate: Java, Go | Familiar: Rust",
    ],
    "experience": [
        "Software Engineer at Google, 2020–2023. Developed scalable microservices using Python and Kubernetes.",
        "Led a team of 5 engineers to deliver a React-based dashboard reducing load time by 40%.",
        "Implemented CI/CD pipelines using Jenkins and GitHub Actions, cutting deployment time by 60%.",
        "Designed and maintained PostgreSQL databases handling 10M+ records.",
        "Built REST APIs with Node.js and Express.js serving 50k daily active users.",
        "Senior Developer, Accenture (2018–2021): Migrated legacy Java monolith to Spring Boot microservices.",
        "Data Engineer at Spotify: Built Apache Spark pipelines processing 1TB of streaming data daily.",
        "Full Stack Developer: Delivered e-commerce platform using Next.js, Django, and AWS.",
        "Machine Learning Engineer: Trained and deployed TensorFlow models for fraud detection.",
        "DevOps Engineer: Managed Kubernetes clusters on GCP, implemented Terraform IaC.",
        "Worked on Angular frontend and Node.js backend for a fintech startup.",
        "Contributed to open-source projects in Python and TypeScript.",
        "Developed mobile applications using React Native and Flutter.",
        "Optimised SQL queries reducing database response time by 70%.",
        "Integrated third-party APIs including Stripe, Twilio, and SendGrid.",
        "Mentored junior developers and conducted code reviews.",
        "Collaborated with product managers using Agile/Scrum methodology.",
        "Architected event-driven systems using Kafka and RabbitMQ.",
        "Implemented OAuth 2.0 and JWT authentication across multiple services.",
        "Deployed and monitored applications using Prometheus and Grafana.",
    ],
    "education": [
        "BSc Computer Science, University of Manchester, 2018–2021. First Class Honours.",
        "MSc Artificial Intelligence, Imperial College London, 2021–2022.",
        "Bachelor of Engineering in Software Engineering, University of Edinburgh, 2:1.",
        "PhD in Machine Learning, University of Cambridge, 2019–2023.",
        "HND Computing, City College, 2016–2018.",
        "A-Levels: Mathematics (A*), Computer Science (A), Physics (A).",
        "Coursera: Deep Learning Specialisation by Andrew Ng, 2022.",
        "AWS Certified Solutions Architect – Associate, 2023.",
        "Google Professional Data Engineer Certification, 2022.",
        "Certified Kubernetes Administrator (CKA), 2023.",
        "BEng Electronic Engineering, University of Bristol, 2015–2019.",
        "Postgraduate Diploma in Data Science, University of Leeds.",
        "Foundation Year in Computing, Coventry University, 2014–2015.",
        "Online courses: React, Node.js, Python on Udemy and Pluralsight.",
        "Microsoft Azure Fundamentals (AZ-900) certified.",
        "Completed bootcamp: Full Stack Web Development, Le Wagon, 2020.",
        "BSc Mathematics with Statistics, University of Warwick.",
        "Relevant modules: Algorithms, Data Structures, Operating Systems, Databases.",
        "Dissertation: Applying NLP to automated CV screening systems.",
        "Graduated with distinction in MSc Software Engineering.",
    ],
    "other": [
        "John Smith | john.smith@email.com | +44 7700 900000 | London, UK",
        "LinkedIn: linkedin.com/in/johnsmith | GitHub: github.com/johnsmith",
        "References available upon request.",
        "Hobbies: Open source contribution, competitive programming, hiking.",
        "Languages: English (native), French (intermediate), Spanish (basic).",
        "Driving licence: Full UK driving licence.",
        "Availability: Available from January 2024.",
        "Nationality: British. Right to work in the UK.",
        "Personal Statement: Passionate software engineer with 5 years of experience.",
        "Objective: Seeking a senior engineering role in a fast-growing tech company.",
        "Volunteer work: Code Club mentor, teaching Python to secondary school students.",
        "Publications: 'Efficient Skill Extraction from CVs', EMNLP 2022.",
        "Awards: Best Final Year Project, University of Manchester, 2021.",
        "Interests: Machine learning research, contributing to open-source projects.",
        "Professional memberships: BCS (British Computer Society).",
        "Curriculum Vitae",
        "Resume",
        "Page 1 of 2",
        "Confidential",
        "Last updated: December 2023",
    ],
}


def generate_section_training_data(
    augment_factor: int = 5,
) -> tuple[list[str], list[str]]:
    """
    Generate (text, label) pairs for section classification.

    Args:
        augment_factor: How many augmented variants to generate per sample.

    Returns:
        Tuple of (texts, labels).
    """
    texts: list[str] = []
    labels: list[str] = []

    for label, samples in SECTION_SAMPLES.items():
        for sample in samples:
            texts.append(sample)
            labels.append(label)

            # Augment: shuffle comma-separated items
            for _ in range(augment_factor):
                parts = [p.strip() for p in sample.split(",")]
                if len(parts) > 2:
                    random.shuffle(parts)
                    texts.append(", ".join(parts))
                    labels.append(label)

    return texts, labels


# ── Skill relevance training data ─────────────────────────────────────────────

def _generate_skill_positives() -> list[str]:
    """Generate positive examples (genuine skill mentions)."""
    positives = list(SKILL_TAXONOMY)
    positives += list(ALIAS_MAP.keys())

    # Multi-skill phrases
    skills = list(SKILL_TAXONOMY)
    for _ in range(80):
        n = random.randint(2, 4)
        sample = random.sample(skills, n)
        positives.append(", ".join(sample))

    # Skill with context
    templates = [
        "experience with {skill}",
        "proficient in {skill}",
        "strong knowledge of {skill}",
        "worked with {skill}",
        "built using {skill}",
        "{skill} development",
        "{skill} programming",
        "expertise in {skill}",
    ]
    for skill in random.sample(skills, 40):
        tmpl = random.choice(templates)
        positives.append(tmpl.format(skill=skill))

    return positives


def _generate_skill_negatives() -> list[str]:
    """Generate negative examples (non-skill text)."""
    return [
        "University of Manchester",
        "London, United Kingdom",
        "References available upon request",
        "john.smith@email.com",
        "+44 7700 900000",
        "January 2020 – March 2023",
        "Bachelor of Science",
        "First Class Honours",
        "Curriculum Vitae",
        "Page 1 of 2",
        "Confidential document",
        "Led a team of engineers",
        "Responsible for managing",
        "Collaborated with stakeholders",
        "Delivered projects on time",
        "Improved performance by 40%",
        "Seeking a challenging role",
        "Passionate about technology",
        "Available immediately",
        "Full UK driving licence",
        "English (native speaker)",
        "Volunteer at local charity",
        "Hobbies include hiking",
        "Award for best project",
        "Published research paper",
        "Member of BCS",
        "Graduated with distinction",
        "Relevant coursework completed",
        "Dissertation on AI ethics",
        "Open to relocation",
        "Salary expectations: negotiable",
        "Notice period: 1 month",
        "Currently employed at",
        "Previously worked at",
        "Managed a budget of",
        "Increased revenue by",
        "Customer satisfaction score",
        "Team size: 10 engineers",
        "Reported to CTO",
        "Cross-functional collaboration",
    ]


def generate_skill_relevance_data() -> tuple[list[str], list[int]]:
    """
    Generate (text, label) pairs for skill relevance classification.
    Label 1 = skill, 0 = not a skill.

    Returns:
        Tuple of (texts, labels).
    """
    positives = _generate_skill_positives()
    negatives = _generate_skill_negatives()

    texts = positives + negatives
    labels = [1] * len(positives) + [0] * len(negatives)

    return texts, labels
