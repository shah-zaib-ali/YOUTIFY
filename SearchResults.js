import { useState, useEffect, useRef, useCallback } from 'react';
import './LoadMoreButton.css';

function SearchResults({ query }) {
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const loader = useRef(null);

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [query]);

    useEffect(() => {
        if (!hasMore) return;
        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(query)}&limit=25&page=${page}`)
            .then(res => res.json())
            .then(data => {
                setResults(prev => page === 1 ? data.results : [...prev, ...data.results]);
                setHasMore(data.results.length > 0);
                setLoading(false);
            });
    }, [page, query, hasMore]);

    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
            setPage(prev => prev + 1);
        }
    }, [hasMore, loading]);

    useEffect(() => {
        const option = { root: null, rootMargin: "20px", threshold: 1.0 };
        const observer = new IntersectionObserver(handleObserver, option);
        if (loader.current) observer.observe(loader.current);
        return () => { if (loader.current) observer.unobserve(loader.current); };
    }, [handleObserver]);

    return (
        <div>
            {results.map(result => (
                <div key={result.id}>
                    {/* Render each result here */}
                </div>
            ))}
            <div ref={loader} />
            {loading && <div>Loading...</div>}
            {!hasMore && results.length > 0 && <div>No more results</div>}
        </div>
    );
}

export default SearchResults;