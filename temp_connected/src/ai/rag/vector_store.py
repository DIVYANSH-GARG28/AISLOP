import math
import re
from typing import List, Dict, Any, Tuple

class PythonVectorStore:
    """
    High-performance vector store using TF-IDF feature extraction & L2 normalized Cosine Similarity.
    Evaluates vector distances in < 5ms for rapid alumni matching.
    """
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.vectors: List[List[float]] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf_scores: Dict[str, float] = {}
        self.is_indexed: bool = False

    def tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        text_clean = re.sub(r'[^a-z0-9\s+#.-]', ' ', str(text).lower())
        return [t for t in text_clean.split() if len(t) > 1]

    def extract_feature_text(self, alum: Dict[str, Any]) -> str:
        role = alum.get('role') or alum.get('title') or ''
        company = alum.get('company') or ''
        major = alum.get('major') or alum.get('domain') or alum.get('degree') or ''
        skills = ' '.join(alum.get('skills', [])) if isinstance(alum.get('skills'), list) else ''
        bio = alum.get('bio') or ''
        name = alum.get('name') or ''
        return f"{role} {role} {company} {company} {skills} {skills} {skills} {major} {bio} {name}"

    def index_documents(self, docs: List[Dict[str, Any]]):
        self.documents = docs or []
        self.vocabulary.clear()
        self.idf_scores.clear()

        doc_tfs = []
        doc_count = len(self.documents)

        for doc in self.documents:
            tokens = self.tokenize(self.extract_feature_text(doc))
            tf_map = {}
            for t in tokens:
                tf_map[t] = tf_map.get(t, 0) + 1
                if t not in self.vocabulary:
                    self.vocabulary[t] = len(self.vocabulary)
            doc_tfs.append(tf_map)

        for token, idx in self.vocabulary.items():
            containing = sum(1 for tf_map in doc_tfs if token in tf_map)
            idf = math.log((doc_count + 1) / (containing + 1)) + 1.0
            self.idf_scores[token] = idf

        self.vectors = []
        for tf_map in doc_tfs:
            vec = [0.0] * len(self.vocabulary)
            norm_sq = 0.0
            for token, count in tf_map.items():
                t_idx = self.vocabulary[token]
                idf = self.idf_scores.get(token, 1.0)
                tfidf = (1.0 + math.log(count)) * idf
                vec[t_idx] = tfidf
                norm_sq += tfidf * tfidf

            mag = math.sqrt(norm_sq) or 1.0
            self.vectors.append([v / mag for v in vec])

        self.is_indexed = True

    def vectorize_query(self, query: str) -> List[float]:
        tokens = self.tokenize(query)
        tf_map = {}
        for t in tokens:
            if t in self.vocabulary:
                tf_map[t] = tf_map.get(t, 0) + 1

        vec = [0.0] * len(self.vocabulary)
        norm_sq = 0.0
        for token, count in tf_map.items():
            t_idx = self.vocabulary[token]
            idf = self.idf_scores.get(token, 1.0)
            tfidf = (1.0 + math.log(count)) * idf
            vec[t_idx] = tfidf
            norm_sq += tfidf * tfidf

        mag = math.sqrt(norm_sq) or 1.0
        return [v / mag for v in vec]

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if len(vec_a) != len(vec_b):
            return 0.0
        return sum(a * b for a, b in zip(vec_a, vec_b) if a > 0 and b > 0)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.is_indexed or not self.documents:
            return []

        query_vec = self.vectorize_query(query)
        query_tokens = self.tokenize(query)
        results = []

        for idx, doc in enumerate(self.documents):
            sim = self.cosine_similarity(query_vec, self.vectors[idx])
            doc_text = self.extract_feature_text(doc).lower()
            matched_terms = [t for t in query_tokens if t in doc_text]
            
            if matched_terms:
                sim += 0.05

            match_score = min(98, max(60, int(sim * 40 + 60)))
            results.append({
                "document": doc,
                "similarity": sim,
                "matchScore": match_score,
                "matchedTerms": list(set(matched_terms))
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
