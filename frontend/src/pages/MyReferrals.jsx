
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { networkingStyles as ns } from '../styles';

const MyReferrals = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);

    useEffect(() => {
        fetchReferrals();
    }, [page, limit]);

    const fetchReferrals = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (search.trim()) params.append('search', search.trim());
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const data = await api.get(`/api/user/my-referrals?${params}`);
            setReferrals(data.referrals);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error('Failed to fetch referrals', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchReferrals();
    };

    const handleFilter = () => {
        setPage(1);
        fetchReferrals();
        setShowDateFilter(false);
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setPage(1);
        setTimeout(() => fetchReferrals(), 0);
        setShowDateFilter(false);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div style={ns.referralsContainer}>
            <PageHeader title="My Referrals" />

            {/* Toolbar */}
            <div style={ns.referralsToolbar}>
                <form onSubmit={handleSearch} style={ns.referralsSearchBox}>
                    <svg style={ns.referralsSearchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={ns.referralsSearchInput}
                    />
                </form>

                <div style={ns.referralsToolbarRight}>
                    <button onClick={() => setShowDateFilter(!showDateFilter)} style={ns.referralsDateBtn}>
                        <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Date Range
                    </button>
                    <button onClick={handleFilter} style={ns.referralsFilterBtn}>
                        <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                        </svg>
                        Filter
                    </button>
                </div>
            </div>

            {/* Date Range Picker */}
            {showDateFilter && (
                <div style={ns.referralsDateFilterRow}>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={ns.referralsDateInput} />
                    <span style={{ color: '#9ca3af' }}>to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={ns.referralsDateInput} />
                    <button onClick={handleFilter} style={ns.referralsApplyBtn}>Apply</button>
                    <button onClick={handleClearFilter} style={ns.referralsClearBtn}>Clear</button>
                </div>
            )}

            {/* Table */}
            <div style={ns.referralsTableWrapper}>
                <table style={ns.referralsTable}>
                    <thead>
                        <tr>
                            <th style={{ ...ns.referralsTh, width: '60px' }}>S.No</th>
                            <th style={ns.referralsTh}>Username (Referral Code)</th>
                            <th style={ns.referralsTh}>Level</th>
                            <th style={ns.referralsTh}>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={ns.referralsEmptyCell}>Loading...</td></tr>
                        ) : referrals.length === 0 ? (
                            <tr><td colSpan="4" style={ns.referralsEmptyCell}>No available options</td></tr>
                        ) : (
                            referrals.map((ref, idx) => (
                                <tr key={ref.id} style={idx % 2 === 0 ? ns.referralsRowEven : ns.referralsRowOdd}>
                                    <td style={ns.referralsTd}>{(page - 1) * limit + idx + 1}</td>
                                    <td style={ns.referralsTd}>{ref.username || 'Unknown'} ({ref.referral_code})</td>
                                    <td style={ns.referralsTd}>{ref.level}</td>
                                    <td style={ns.referralsTd}>{formatDate(ref.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={ns.referralsPagination}>
                <div style={ns.referralsPaginationLeft}>
                    <span style={{ color: '#ef4444', fontSize: '13px' }}>Rows:</span>
                    <select
                        value={limit}
                        onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                        style={ns.referralsRowsSelect}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div style={ns.referralsPaginationRight}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={{ ...ns.referralsPageBtn, opacity: page <= 1 ? 0.5 : 1 }}
                    >
                        ‹ Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        style={{ ...ns.referralsPageBtn, opacity: page >= totalPages ? 0.5 : 1 }}
                    >
                        Next ›
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyReferrals;
