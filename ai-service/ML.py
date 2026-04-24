"""
ML Service
Main service for machine learning operations
Integrates document classification, entity extraction, and pattern detection

Production enhancements:
- Thread-safe initialization
- Retry strategies
- Structured logging
- Error handling
"""
from app.ml.document_classifier import DocumentClassifier
from app.ml.pattern_detector import PatternDetector
from app.ml.text_extractor import TextExtractor
from app.utils.retry_strategies import RetryStrategies
from app.utils.logging_config import get_logger
import os
import threading

logger = get_logger(__name__)


class MLService:
    """Main ML service for document analysis"""
    
    _classifier = None
    _pattern_detector = None
    _initialized = False
    _lock = threading.Lock()  # Thread-safe initialization
    
    @classmethod
    def initialize(cls, model_path='ml_models'):
        """
        Initialize ML models (thread-safe)
        
        Args:
            model_path: Path to ML models directory
        """
        # Double-checked locking pattern for thread safety
        if cls._initialized:
            return
        
        with cls._lock:
            # Check again inside lock
            if cls._initialized:
                return
            
            logger.info("Initializing ML Service...")
            
            try:
                # Initialize document classifier
                classifier_path = os.path.join(model_path, 'document_classifier_final')
                cls._classifier = DocumentClassifier(classifier_path)
                
                # Initialize pattern detector
                cls._pattern_detector = PatternDetector()
                
                cls._initialized = True
                logger.info("ML Service initialized successfully!")
            except Exception as e:
                logger.error(f"Error initializing ML Service: {e}", exc_info=True)
                cls._initialized = False
                raise
    
    @classmethod
    def classify_document(cls, text):
        """
        Classify document type
        
        Args:
            text: Document text
            
        Returns:
            dict with category, confidence, probabilities
        """
        if not cls._initialized:
            cls.initialize()
        
        return cls._classifier.predict(text)
    
    @classmethod
    def detect_patterns(cls, text):
        """
        Detect potentially unfair clauses
        
        Args:
            text: Document text
            
        Returns:
            List of detected issues
        """
        if not cls._initialized:
            cls.initialize()
        
        return cls._pattern_detector.detect(text)
    
    @classmethod
    def analyze_severity(cls, issues):
        """
        Analyze overall severity of issues
        
        Args:
            issues: List of detected issues
            
        Returns:
            dict with severity analysis
        """
        if not cls._initialized:
            cls.initialize()
        
        return cls._pattern_detector.analyze_severity(issues)
    
    @classmethod
    def extract_text(cls, file_path, file_type):
        """
        Extract text from file with validation
        
        Args:
            file_path: Path to file
            file_type: File extension
            
        Returns:
            Extracted text string
            
        Raises:
            ValueError: If file type is unsupported or file doesn't exist
            IOError: If file cannot be read
        """
        # Validate inputs
        if not file_path:
            raise ValueError("File path cannot be empty")
        
        if not os.path.exists(file_path):
            raise IOError(f"File not found: {file_path}")
        
        if not file_type:
            raise ValueError("File type cannot be empty")
        
        # Normalize file type
        file_type = file_type.lower().strip()
        
        try:
            if file_type in ['jpg', 'jpeg', 'png']:
                return TextExtractor.extract_from_image(file_path)
            elif file_type == 'pdf':
                return TextExtractor.extract_from_pdf(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}. Supported types: pdf, jpg, jpeg, png")
        except Exception as e:
            print(f"Error extracting text from {file_type} file: {e}")
            raise
    
    @classmethod
    def process_document(cls, file_path, file_type):
        """
        Complete document processing pipeline
        
        Args:
            file_path: Path to document file
            file_type: File extension
            
        Returns:
            dict with complete analysis results
        """
        if not cls._initialized:
            cls.initialize()
        
        # Step 1: Extract text
        print(f"Extracting text from {file_type} file...")
        text = cls.extract_text(file_path, file_type)
        
        if not text or len(text) < 10:
            return {
                'success': False,
                'error': 'Could not extract text from document',
                'extracted_text': text
            }
        
        # Step 2: Classify document
        print("Classifying document...")
        classification = cls.classify_document(text)
        
        # Step 3: Detect patterns/issues
        print("Detecting patterns...")
        issues = cls.detect_patterns(text)
        
        # Step 4: Analyze severity
        severity_analysis = cls.analyze_severity(issues)
        
        # Step 5: Generate summary
        summary = cls._generate_summary(text, classification, issues, severity_analysis)
        
        return {
            'success': True,
            'extracted_text': text,
            'classification': classification,
            'detected_issues': issues,
            'severity_analysis': severity_analysis,
            'summary': summary,
            'recommendations': cls._generate_recommendations(issues)
        }
    
    @classmethod
    def analyze_text(cls, text, context=None):
        """
        Analyze pasted text (no file upload) with validation
        
        Args:
            text: Document text
            context: Optional context hint
            
        Returns:
            dict with analysis results
        """
        if not cls._initialized:
            cls.initialize()
        
        # Validate input
        if text is None:
            return {
                'success': False,
                'error': 'Text cannot be None'
            }
        
        if not isinstance(text, str):
            return {
                'success': False,
                'error': f'Text must be a string, got {type(text).__name__}'
            }
        
        # Strip whitespace
        text = text.strip()
        
        if not text:
            return {
                'success': False,
                'error': 'Text cannot be empty'
            }
        
        if len(text) < 10:
            return {
                'success': False,
                'error': 'Text too short for analysis (minimum 10 characters)'
            }
        
        # Limit text length to prevent memory issues
        max_length = 100000  # 100k characters
        if len(text) > max_length:
            return {
                'success': False,
                'error': f'Text too long (maximum {max_length} characters)'
            }
        
        try:
            # Classify
            classification = cls.classify_document(text)
            
            # Detect issues
            issues = cls.detect_patterns(text)
            
            # Analyze severity
            severity_analysis = cls.analyze_severity(issues)
            
            # Generate summary
            summary = cls._generate_summary(text, classification, issues, severity_analysis)
            
            return {
                'success': True,
                'classification': classification,
                'detected_issues': issues,
                'severity_analysis': severity_analysis,
                'summary': summary,
                'recommendations': cls._generate_recommendations(issues)
            }
        except Exception as e:
            print(f"Error analyzing text: {e}")
            return {
                'success': False,
                'error': f'Analysis failed: {str(e)}'
            }
    
    @classmethod
    def _generate_summary(cls, text, classification, issues, severity_analysis):
        """Generate plain English summary"""
        category = classification['category'].replace('_', ' ').title()
        confidence = classification['confidence']
        
        summary = f"This appears to be a {category} "
        summary += f"(confidence: {confidence*100:.1f}%). "
        
        if not issues:
            summary += "No significant issues detected. "
            summary += "However, it's always recommended to have legal documents reviewed by a professional."
        else:
            num_issues = len(issues)
            summary += f"{num_issues} potential issue(s) detected. "
            
            if severity_analysis['critical_count'] > 0:
                summary += f"⚠️ {severity_analysis['critical_count']} CRITICAL issue(s) found. "
                summary += "Seek legal advice immediately from Shelter or Citizens Advice. "
            
            if severity_analysis['high_count'] > 0:
                summary += f"{severity_analysis['high_count']} high-priority issue(s) found. "
            
            summary += "Review the detailed analysis below and consider seeking professional advice."
        
        return summary
    
    @classmethod
    def _generate_recommendations(cls, issues):
        """Generate overall recommendations based on all issues"""
        if not issues:
            return [
                "Document appears compliant with UK housing law",
                "Keep a copy of this document for your records",
                "If you have concerns, contact Shelter or Citizens Advice"
            ]
        
        recommendations = set()
        
        # Add issue-specific recommendations
        for issue in issues:
            for rec in issue.get('recommendations', []):
                recommendations.add(rec)
        
        # Add general recommendations based on severity
        critical_issues = [i for i in issues if i['severity'] == 'CRITICAL']
        if critical_issues:
            recommendations.add(" URGENT: Contact Shelter (0808 800 4444) or Citizens Advice immediately")
            recommendations.add("Do not sign this document without legal advice")
        
        high_issues = [i for i in issues if i['severity'] == 'HIGH']
        if high_issues:
            recommendations.add("Seek legal advice before proceeding")
            recommendations.add("Request clarification or amendments to problematic clauses")
        
        # Always add these
        recommendations.add("Keep copies of all documents and communications")
        recommendations.add("Document any issues or concerns in writing")
        
        return list(recommendations)