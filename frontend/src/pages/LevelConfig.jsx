import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';

const LevelConfig = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [levelConfigs, setLevelConfigs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [modalData, setModalData] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [openActionId, setOpenActionId] = useState(null);

    const [statusModal, setStatusModal] = useState({ show: false, id: null, newStatus: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [successMessage, setSuccessMessage] = useState({ show: false, message: '' });

    useEffect(() => {
        fetchLevelConfigs();
    }, []);

    const fetchLevelConfigs = async () => {
        try {
            const response = await fetch(`${API_URL}/api/level-configs`, { headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setLevelConfigs(data);
            }
        } catch (err) {
            console.error('Failed to fetch level configs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const filtered = getFilteredData();
        setTotalPages(Math.ceil(filtered.length / rowsPerPage) || 1);
    }, [levelConfigs, debouncedSearch, rowsPerPage]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const toggleActionMenu = (id) => {
        setOpenActionId(openActionId === id ? null : id);
    };

    const handleStatusToggle = (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        setStatusModal({
            show: true,
            id: id,
            newStatus: newStatus
        });
    };

    const confirmStatusChange = async () => {
        const config = levelConfigs.find(c => c.id === statusModal.id);
        if (!config) return;

        try {
            const response = await fetch(`${API_URL}/api/level-configs/${statusModal.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...config, status: statusModal.newStatus })
            });
            if (response.ok) {
                const updatedConfig = await response.json();
                setLevelConfigs(levelConfigs.map(c => c.id === statusModal.id ? updatedConfig : c));
                showSuccessMessage(`Status changed to ${statusModal.newStatus === 'active' ? 'Active' : 'Inactive'} successfully!`);
            } else {
                alert('Failed to update config status');
            }
        } catch (err) {
            console.error(err);
        }
        setStatusModal({ show: false, id: null, newStatus: null });
    };

    const handleEditClick = (config) => {
        setModalData({ ...config });
        setOpenActionId(null);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id: id });
        setOpenActionId(null);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`${API_URL}/api/level-configs/${deleteModal.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                setLevelConfigs(levelConfigs.filter(config => config.id !== deleteModal.id));
                showSuccessMessage('Level configuration deleted successfully!');
            } else {
                alert('Failed to delete configuration');
            }
        } catch (err) {
            console.error(err);
        }
        setDeleteModal({ show: false, id: null });
    };

    const handleAddNew = () => {
        setIsAddModalOpen(true);
        setModalData({
            level: (levelConfigs.length ? Math.max(...levelConfigs.map(c => c.level)) : 0) + 1,
            percentage: '',
            required_volume: '',
            status: "active"
        });
    };

    const handleModalChange = (field, value) => {
        setModalData({ ...modalData, [field]: value });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            if (modalData.id) {
                const response = await fetch(`${API_URL}/api/level-configs/${modalData.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(modalData)
                });
                if (response.ok) {
                    const updatedConfig = await response.json();
                    setLevelConfigs(levelConfigs.map(config => config.id === modalData.id ? updatedConfig : config));
                    showSuccessMessage('Level configuration updated successfully!');
                    setModalData(null);
                    setIsAddModalOpen(false);
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to update level configuration');
                }
            } else {
                const response = await fetch(`${API_URL}/api/level-configs`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(modalData)
                });
                if (response.ok) {
                    const newConfig = await response.json();
                    setLevelConfigs([...levelConfigs, newConfig].sort((a, b) => a.level - b.level));
                    showSuccessMessage('New level configuration added successfully!');
                    setModalData(null);
                    setIsAddModalOpen(false);
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to add level configuration');
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const showSuccessMessage = (message) => {
        setSuccessMessage({ show: true, message: message });
        setTimeout(() => {
            setSuccessMessage({ show: false, message: '' });
        }, 3000);
    };

    const getFilteredData = () => {
        if (!debouncedSearch) return levelConfigs;

        return levelConfigs.filter(item =>
            item.level.toString().includes(debouncedSearch) ||
            item.percentage.toString().includes(debouncedSearch) ||
            item.required_volume.toString().includes(debouncedSearch)
        );
    };

    const getCurrentPageData = () => {
        const filtered = getFilteredData();
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filtered.slice(startIndex, endIndex);
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    if (loading) {
        return (
            <div className={styles.levelContainer}>
                <h2 className="text-white p-6">Loading level configurations...</h2>
            </div>
        );
    }

    return (
        <div className={styles.levelContainer}>
            {successMessage.show && (
                <div className={styles.levelSuccessMessage}>
                    <div className={styles.levelSuccessContent}>
                        <svg className={styles.levelSuccessIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className={styles.levelSuccessText}>{successMessage.message}</span>
                    </div>
                </div>
            )}

            <div className={styles.levelHeader}>
                <div className={styles.levelHeaderLeft}>
                    <h2 className={styles.levelTitle}>Level Configuration</h2>
                </div>
            </div>

            <div className={styles.levelTableWrapper}>
                <div className={styles.levelSearchHeader}>
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search level config..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    {user?.role === 'admin' && (
                        <button
                            onClick={handleAddNew}
                            className={styles.levelAddButton}
                        >
                            <svg className={styles.levelAddIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Add Configuration
                        </button>
                    )}
                </div>

                <table className={styles.levelTable}>
                    <thead className={styles.levelThead}>
                        <tr>
                            <th className={styles.levelTh}>S.No</th>
                            <th className={styles.levelTh}>Level</th>
                            <th className={styles.levelTh}>Percentage</th>
                            <th className={styles.levelTh}>Required Volume</th>
                            <th className={styles.levelTh}>Status</th>
                            <th className={styles.levelTh}>Created At</th>
                            <th className={styles.levelTh}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getCurrentPageData().map((config, index) => (
                            <tr key={config.id} className={styles.levelTr}>
                                <td className={styles.levelTdBold}>
                                    {((currentPage - 1) * rowsPerPage) + index + 1}
                                </td>
                                <td className={styles.levelTd}>
                                    <span className={styles.levelNumber}>Level {config.level}</span>
                                </td>
                                <td className={styles.levelTd}>
                                    <span className={styles.levelPercentage}>
                                        {config.percentage}%
                                    </span>
                                </td>
                                <td className={styles.levelTd}>
                                    <span className={styles.levelVolume}>
                                        ${config.required_volume.toLocaleString()}
                                    </span>
                                </td>
                                <td className={styles.levelTd}>
                                    {user?.role === 'admin' ? (
                                        <label className={styles.switchWrapper}>
                                            <input
                                                type="checkbox"
                                                className={styles.switchInput}
                                                checked={config.status === 'active'}
                                                onChange={() => handleStatusToggle(config.id, config.status)}
                                            />
                                            <div className={styles.switchBg}></div>
                                        </label>
                                    ) : (
                                        <span className={styles.levelStatusText}>
                                            {config.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    )}
                                </td>
                                <td className={styles.levelTd}>
                                    {new Date(config.created_at).toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true
                                    })}
                                </td>
                                <td className={styles.levelActionCell}>
                                    {user?.role === 'admin' && (
                                        <>
                                            <button
                                                className={styles.levelActionButton}
                                                onClick={() => toggleActionMenu(config.id)}
                                            >
                                                <svg className={styles.levelActionIcon} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                                                </svg>
                                            </button>

                                            {openActionId === config.id && (
                                                <div className={styles.levelDropdownMenu}>
                                                    <div
                                                        className={styles.levelDropdownItem}
                                                        onClick={() => handleEditClick(config)}
                                                    >
                                                        Edit
                                                    </div>
                                                    <div
                                                        className={styles.levelDropdownItemDelete}
                                                        onClick={() => handleDeleteClick(config.id)}
                                                    >
                                                        Delete
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {getCurrentPageData().length === 0 && (
                            <tr>
                                <td colSpan="7" className={styles.levelNoData}>
                                    No level configurations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className={styles.paginationContainer}>
                    <div className={styles.paginationRowsWrapper}>
                        <span className={styles.paginationRowsLabel}>Rows:</span>
                        <select
                            className={styles.rowsSelect}
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className={styles.paginationControls}>
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={styles.paginationButton}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Previous
                        </button>

                        <div className={styles.paginationNumbers}>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (currentPage > 3 && totalPages > 5) {
                                    pageNum = currentPage - 3 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (5 - i - 1);
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? styles.paginationActive : styles.paginationInactive}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={styles.paginationButton}
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            Next
                            <svg className={styles.paginationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {statusModal.show && (
                <div className={styles.levelModalOverlay}>
                    <div className={styles.levelModal}>
                        <div className={styles.levelModalHeader}>
                            <h3 className={styles.levelModalTitle}>Confirm Status Change</h3>
                        </div>

                        <div className={styles.levelModalBody}>
                            <p className={styles.levelModalText}>
                                Are you sure you want to change this level status to <span className={`${styles.levelModalStatus} ${statusModal.newStatus === 'active' ? styles.levelModalStatusActive : styles.levelModalStatusInactive}`}>
                                    {statusModal.newStatus === 'active' ? 'Active' : 'Inactive'}
                                </span>?
                            </p>

                            <div className={styles.levelModalActions}>
                                <button
                                    onClick={() => setStatusModal({ show: false, id: null, newStatus: null })}
                                    className={styles.levelModalCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmStatusChange}
                                    className={styles.levelModalConfirm}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.show && (
                <div className={styles.levelModalOverlay}>
                    <div className={styles.levelModal}>
                        <div className={styles.levelModalHeader}>
                            <h3 className={styles.levelModalTitle}>Confirm Delete</h3>
                        </div>

                        <div className={styles.levelModalBody}>
                            <p className={styles.levelModalText}>
                                Are you sure you want to delete this level configuration? This action cannot be undone.
                            </p>

                            <div className={styles.levelModalActions}>
                                <button
                                    onClick={() => setDeleteModal({ show: false, id: null })}
                                    className={styles.levelModalCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className={styles.levelModalConfirm}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(isAddModalOpen || modalData?.id) && (
                <div className={styles.levelModalOverlay}>
                    <div className={styles.levelModalForm}>
                        <div className={styles.levelModalHeader}>
                            <h3 className={styles.levelModalTitle}>
                                {modalData?.id ? 'Edit Level' : 'Add New Level'}
                            </h3>
                            <button
                                onClick={() => {
                                    setModalData(null);
                                    setIsAddModalOpen(false);
                                }}
                                className={styles.levelModalClose}
                            >
                                <svg className={styles.levelModalCloseIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className={styles.levelModalFormBody}>
                            <div className={styles.levelModalField}>
                                <label className={styles.levelModalLabel}>Level</label>
                                <input
                                    type="number"
                                    className={styles.levelModalInput}
                                    value={modalData?.level || ''}
                                    onChange={(e) => handleModalChange('level', parseInt(e.target.value))}
                                    required
                                />
                            </div>

                            <div className={styles.levelModalField}>
                                <label className={styles.levelModalLabel}>Percentage (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className={styles.levelModalInput}
                                    value={modalData?.percentage || ''}
                                    onChange={(e) => handleModalChange('percentage', parseFloat(e.target.value))}
                                    required
                                />
                            </div>

                            <div className={styles.levelModalField}>
                                <label className={styles.levelModalLabel}>Required Volume ($)</label>
                                <input
                                    type="number"
                                    className={styles.levelModalInput}
                                    value={modalData?.required_volume || ''}
                                    onChange={(e) => handleModalChange('required_volume', parseInt(e.target.value))}
                                    required
                                />
                            </div>

                            <div className={styles.levelModalField}>
                                <label className={styles.levelModalLabel}>Status</label>
                                <select
                                    className={styles.levelModalSelect}
                                    value={modalData?.status || 'active'}
                                    onChange={(e) => handleModalChange('status', e.target.value)}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className={styles.levelModalFormActions}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalData(null);
                                        setIsAddModalOpen(false);
                                    }}
                                    className={styles.levelModalCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.levelModalConfirm}
                                >
                                    {modalData?.id ? 'Save Changes' : 'Add Level'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{styles.levelAnimations}</style>
        </div>
    );
};

export default LevelConfig;