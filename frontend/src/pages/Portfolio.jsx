
import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from '../styles';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';

const Portfolio = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState({ show: false, message: '' });

    useEffect(() => {
        fetchMyPlans();
    }, []);

    const fetchMyPlans = async () => {
        try {
            const response = await fetch(`${API_URL}/api/plans/my-plans`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(data);
            }
        } catch (err) {
            console.error('Failed to fetch portfolio', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD format
    };

    const getStatusClass = (status) => {
        if (status === 'Plan Ongoing') return styles.portfolioStatusOngoing;
        if (status === 'Completed') return styles.portfolioStatusCompleted;
        return styles.portfolioStatusCancelled;
    };

    if (loading) {
        return (
            <div className={styles.portfolioContainer}>
                <div className={styles.portfolioHeader}>
                    <div className={styles.portfolioHeaderLeft}>
                        <h2 className={styles.portfolioTitle}>My Portfolio</h2>
                    </div>
                </div>
                <div className="text-center text-gray-500 py-12">Loading portfolio...</div>
            </div>
        );
    }

    return (
        <div className={styles.portfolioContainer}>
            {successMessage.show && (
                <div className="fixed top-5 right-5 z-50 animate-slideIn">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <CheckCircle2 size={20} />
                        <span className="font-medium">{successMessage.message}</span>
                    </div>
                </div>
            )}

            <div className={styles.portfolioHeader}>
                <div className={styles.portfolioHeaderLeft}>
                    <h2 className={styles.portfolioTitle}>My Portfolio</h2>
                </div>
            </div>

            {plans.length === 0 ? (
                <div className={styles.portfolioNoData}>
                    <svg className={styles.portfolioNoDataIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 className={styles.portfolioNoDataTitle}>No Plans Purchased Yet</h3>
                    <p className={styles.portfolioNoDataSubtitle}>Visit the Plans page to buy your first plan</p>
                </div>
            ) : (
                <div className={styles.portfolioGrid}>
                    {plans.map((plan) => (
                        <div key={plan.id} className={styles.portfolioCard}>
                            <div className={styles.portfolioCardBg}></div>
                            <div className={styles.portfolioCardContent}>
                                {/* Icon */}
                                <div className={styles.portfolioIconWrapper}>
                                    <div className={styles.portfolioIcon}>
                                        <svg className={styles.portfolioIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                        </svg>
                                    </div>
                                </div>

                                {/* Plan Name */}
                                <h3 className={styles.portfolioPlanName}>{plan.planName}</h3>

                                {/* Details */}
                                <p className={styles.portfolioDetail}>
                                    <span className={styles.portfolioDetailLabel}>Purchased: </span>
                                    <span className={styles.portfolioDetailRed}>${parseFloat(plan.amount).toLocaleString()}</span>
                                </p>

                                <p className={styles.portfolioDetail}>
                                    <span className={styles.portfolioDetailLabel}>TotalEarnings: </span>
                                    <span className={styles.portfolioDetailGreen}>
                                        ${plan.totalEarnings} ({plan.roiEarnings}+{plan.levelEarnings})
                                    </span>
                                </p>

                                <p className={styles.portfolioDetail}>
                                    <span className={styles.portfolioDetailLabel}>Ceiling: </span>
                                    <span className={styles.portfolioDetailYellow}>${parseFloat(plan.ceilingAmount).toLocaleString()}</span>
                                </p>

                                {/* Progress Bar */}
                                <div className={styles.portfolioProgressWrapper}>
                                    <div className={styles.portfolioProgressHeader}>
                                        <span className={styles.portfolioProgressLabel}>Progress</span>
                                        <div className="flex items-center gap-1">
                                            {plan.progress >= 100 && <CheckCircle2 size={12} className="text-green-400" />}
                                            <span className={`${styles.portfolioProgressValue} ${plan.progress >= 100 ? 'text-green-400' : ''}`}>
                                                {plan.progress}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.portfolioProgressBar}>
                                        <div
                                            className={`${styles.portfolioProgressFill} ${plan.status === 'Completed' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : ''}`}
                                            style={{ width: `${Math.min(plan.progress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Footer Details */}
                                <div className={styles.portfolioFooter}>
                                    <p className={styles.portfolioFooterText}>
                                        <span className={styles.portfolioDetailLabel}>Duration: </span>
                                        <span className={styles.portfolioDetailGreen}>
                                            {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                                        </span>
                                    </p>

                                    <p className={styles.portfolioFooterText}>
                                        <span className={styles.portfolioDetailLabel}>Remaining Days: </span>
                                        <span className={styles.portfolioDetailRed}>{plan.remainingDays}</span>
                                    </p>

                                    <p className={styles.portfolioFooterText}>
                                        <span className={styles.portfolioDetailLabel}>Status: </span>
                                        <span className={getStatusClass(plan.status)}>
                                            {plan.status === 'Completed' ? (
                                                <span className="flex items-center gap-1 uppercase tracking-wider">
                                                    {plan.status}
                                                    <CheckCircle2 size={14} />
                                                </span>
                                            ) : (
                                                plan.status
                                            )}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{styles.portfolioAnimations}</style>
        </div>
    );
};

export default Portfolio;
