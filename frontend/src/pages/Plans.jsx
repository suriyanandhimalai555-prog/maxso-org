
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Edit3,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import styles from '../styles';
import API_URL from '../config/api';
import { getAuthHeaders } from '../services/api';
import { useSelector } from 'react-redux';

const PlansPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);

  const [successMessage, setSuccessMessage] = useState({ show: false, message: '' });

  // Buy Plan Modal State
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyPlan, setBuyPlan] = useState(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [buyDepositType, setBuyDepositType] = useState('');
  const [buyError, setBuyError] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plans`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${API_URL}/api/plans/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...plan, status: newStatus })
      });
      if (response.ok) {
        const updatedPlan = await response.json();
        setPlans(plans.map(p => p.id === id ? updatedPlan : p));
        showSuccessMessage('Plan status updated successfully!');
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (plan) => {
    setModalData({ ...plan });
    setOpenActionId(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        const response = await fetch(`${API_URL}/api/plans/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (response.ok) {
          setPlans(plans.filter(plan => plan.id !== id));
          showSuccessMessage('Plan deleted successfully!');
        } else {
          alert('Failed to delete plan');
        }
      } catch (err) {
        console.error(err);
      }
    }
    setOpenActionId(null);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
    setModalData({
      name: '',
      roi: '',
      duration: '',
      durationUnit: 'months',
      referralBonus: '',
      ceilingLimit: '',
      minDeposit: '',
      maxDeposit: '',
      status: 'active'
    });
  };

  const handleModalChange = (field, value) => {
    setModalData({ ...modalData, [field]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (modalData.id) {
        const response = await fetch(`${API_URL}/api/plans/${modalData.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(modalData)
        });
        if (response.ok) {
          const updatedPlan = await response.json();
          setPlans(plans.map(plan => plan.id === modalData.id ? updatedPlan : plan));
          showSuccessMessage('Plan updated successfully!');
          setModalData(null);
          setIsAddModalOpen(false);
        } else {
          alert('Failed to update plan');
        }
      } else {
        const response = await fetch(`${API_URL}/api/plans`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(modalData)
        });
        if (response.ok) {
          const newPlan = await response.json();
          setPlans([...plans, newPlan]);
          showSuccessMessage('New plan added successfully!');
          setModalData(null);
          setIsAddModalOpen(false);
        } else {
          alert('Failed to create plan');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buy Plan Handlers
  const handleBuyClick = (plan) => {
    setBuyPlan(plan);
    setBuyAmount('');
    setBuyDepositType('');
    setBuyError('');
    setIsBuyModalOpen(true);
  };

  const handleBuySubmit = async (e) => {
    e.preventDefault();
    setBuyError('');

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      setBuyError('Please enter a valid amount');
      return;
    }
    if (!buyDepositType) {
      setBuyError('Please select a deposit type');
      return;
    }
    if (parseFloat(buyAmount) < parseFloat(buyPlan.minDeposit)) {
      setBuyError(`Minimum deposit is $${buyPlan.minDeposit}`);
      return;
    }
    if (parseFloat(buyAmount) > parseFloat(buyPlan.maxDeposit)) {
      setBuyError(`Maximum deposit is $${buyPlan.maxDeposit}`);
      return;
    }

    setBuyLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/plans/${buyPlan.id}/buy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: parseFloat(buyAmount),
          depositType: buyDepositType
        })
      });

      if (response.ok) {
        showSuccessMessage('Plan purchased successfully!');
        setIsBuyModalOpen(false);
        setBuyPlan(null);
      } else {
        const data = await response.json();
        setBuyError(data.error || 'Failed to purchase plan');
      }
    } catch (err) {
      setBuyError('Network error. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage({ show: true, message });
    setTimeout(() => setSuccessMessage({ show: false, message: '' }), 3000);
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? styles.planStatusActive
      : styles.planStatusInactive;
  };

  return (
    <div className={styles.planContainer}>
      {successMessage.show && (
        <div className={styles.planSuccessMessage}>
          <div className={styles.planSuccessContent}>
            <CheckCircle2 size={20} />
            <span className={styles.planSuccessText}>{successMessage.message}</span>
          </div>
        </div>
      )}

      <div className={styles.planHeader}>
        <div className={styles.planHeaderLeft}>
          <h2 className={styles.planTitle}>Plans</h2>
        </div>
      </div>

      <div className={styles.planActionBar}>
        {user?.role === 'admin' && (
          <button
            onClick={handleAddClick}
            className={styles.planAddButton}
          >
            <Plus size={18} />
            Add Plan
          </button>
        )}
      </div>

      <div className={styles.planGrid}>
        {plans
          .filter(plan => plan.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              <div className={styles.planWaveOverlay}></div>

              <div className={styles.planCardHeader}>
                <h3 className={styles.planCardTitle}>{plan.name}</h3>
                <div className={styles.planCardActions}>
                  <div className={styles.planStatusWrapper}>
                    <span className={styles.planStatusText}>
                      {plan.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(plan.id)}
                        className={`${styles.planToggleButton} ${plan.status === 'active' ? styles.planToggleActive : styles.planToggleInactive}`}
                      >
                        <div className={`${styles.planToggleDot} ${plan.status === 'active' ? styles.planToggleDotActive : styles.planToggleDotInactive}`} />
                      </button>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <div className={styles.planActionMenuContainer}>
                      <button
                        onClick={() => setOpenActionId(openActionId === plan.id ? null : plan.id)}
                        className={styles.planActionButton}
                      >
                        <Edit3 size={16} />
                      </button>

                      {openActionId === plan.id && (
                        <div className={styles.planDropdownMenu}>
                          <div
                            className={styles.planDropdownItem}
                            onClick={() => handleEditClick(plan)}
                          >
                            Edit
                          </div>
                          <div
                            className={styles.planDropdownItemDelete}
                            onClick={() => handleDeleteClick(plan.id)}
                          >
                            Delete
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.planDetails}>
                <PlanDetail label="ROI" value={`${plan.roi}%`} />
                <PlanDetail label="Duration" value={`${plan.duration} ${plan.durationUnit}`} />
                <PlanDetail label="Referral Bonus" value={`${plan.referralBonus}%`} />
                <PlanDetail label="Ceiling Limit" value={plan.ceilingLimit} />
                <PlanDetail label="Deposit Amount Limit" value={`${plan.minDeposit} - ${plan.maxDeposit}`} />
              </div>

              <div className={styles.planCreatedAt}>
                Created: {new Date(plan.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Buy Now Button - visible only to non-admin users for active plans */}
              {user?.role !== 'admin' && plan.status === 'active' && (
                <button
                  onClick={() => handleBuyClick(plan)}
                  className={styles.planBuyButton}
                >
                  <ShoppingCart size={18} />
                  Buy Now
                </button>
              )}
              {user?.role !== 'admin' && plan.status !== 'active' && (
                <div className={styles.planBuyButtonDisabled}>
                  Plan Inactive
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Admin Add/Edit Modal */}
      {(isAddModalOpen || modalData?.id) && (
        <div className={styles.planModalOverlay}>
          <div className={styles.planModal}>
            <div className={styles.planModalHeader}>
              <h3 className={styles.planModalTitle}>
                {modalData?.id ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <button
                onClick={() => {
                  setModalData(null);
                  setIsAddModalOpen(false);
                }}
                className={styles.planModalClose}
              >
                <svg className={styles.planModalCloseIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.planModalForm}>
              <div className={styles.planModalGrid}>
                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Plan Name</label>
                  <input
                    type="text"
                    className={styles.planModalInput}
                    value={modalData?.name || ''}
                    onChange={(e) => handleModalChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>ROI (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className={styles.planModalInput}
                    value={modalData?.roi || ''}
                    onChange={(e) => handleModalChange('roi', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Duration</label>
                  <input
                    type="number"
                    className={styles.planModalInput}
                    value={modalData?.duration || ''}
                    onChange={(e) => handleModalChange('duration', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Duration Unit</label>
                  <select
                    className={styles.planModalSelect}
                    value={modalData?.durationUnit || 'months'}
                    onChange={(e) => handleModalChange('durationUnit', e.target.value)}
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Referral Bonus (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className={styles.planModalInput}
                    value={modalData?.referralBonus || ''}
                    onChange={(e) => handleModalChange('referralBonus', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Min Deposit ($)</label>
                  <input
                    type="number"
                    className={styles.planModalInput}
                    value={modalData?.minDeposit || ''}
                    onChange={(e) => handleModalChange('minDeposit', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Max Deposit ($)</label>
                  <input
                    type="number"
                    className={styles.planModalInput}
                    value={modalData?.maxDeposit || ''}
                    onChange={(e) => handleModalChange('maxDeposit', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.planModalField}>
                  <label className={styles.planModalLabel}>Status</label>
                  <select
                    className={styles.planModalSelect}
                    value={modalData?.status || 'active'}
                    onChange={(e) => handleModalChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className={styles.planModalFieldFull}>
                  <label className={styles.planModalLabel}>Ceiling Limit</label>
                  <input
                    type="text"
                    className={styles.planModalInput}
                    value={modalData?.ceilingLimit || ''}
                    onChange={(e) => handleModalChange('ceilingLimit', e.target.value)}
                    placeholder="e.g., 10X of ROI + Level Income"
                    required
                  />
                </div>
              </div>

              <div className={styles.planModalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setModalData(null);
                    setIsAddModalOpen(false);
                  }}
                  className={styles.planModalCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.planModalSubmit}
                >
                  {modalData?.id ? 'Save Changes' : 'Add Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buy Plan Modal */}
      {isBuyModalOpen && buyPlan && (
        <div className={styles.planBuyModalOverlay}>
          <div className={styles.planBuyModal}>
            <div className={styles.planBuyModalBg}></div>
            <div className={styles.planBuyModalDecor}></div>
            <div className={styles.planBuyModalContent}>
              <div className={styles.planBuyModalHeader}>
                <h3 className={styles.planBuyModalTitle}>Buy Plan</h3>
                <button
                  onClick={() => {
                    setIsBuyModalOpen(false);
                    setBuyPlan(null);
                    setBuyError('');
                  }}
                  className={styles.planBuyModalClose}
                >
                  <svg className={styles.planBuyModalCloseIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {buyError && (
                <div className={styles.planBuyModalError}>{buyError}</div>
              )}

              <form onSubmit={handleBuySubmit}>
                <div className={styles.planBuyModalField}>
                  <label className={styles.planBuyModalLabel}>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.planBuyModalInput}
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder={`Enter amount ($${buyPlan.minDeposit} - $${buyPlan.maxDeposit})`}
                    required
                  />
                  <p className={styles.planBuyModalHint}>
                    Min: ${buyPlan.minDeposit} | Max: ${buyPlan.maxDeposit}
                  </p>
                </div>

                <div className={styles.planBuyModalField}>
                  <label className={styles.planBuyModalLabel}>Deposit Type</label>
                  <select
                    className={styles.planBuyModalSelect}
                    value={buyDepositType}
                    onChange={(e) => setBuyDepositType(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Deposit Type</option>
                    <option value="trust_wallet">Trust Wallet</option>
                    <option value="roi_wallet">ROI Wallet</option>
                    <option value="level_wallet">Level Wallet</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={buyLoading}
                  className={styles.planBuyModalSubmit}
                >
                  {buyLoading ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{styles.planAnimations}</style>
    </div>
  );
};

const PlanDetail = ({ label, value }) => (
  <div className={styles.planDetailItem}>
    <CheckCircle2 size={18} className={styles.planDetailIcon} />
    <p className={styles.planDetailText}>
      <span className={styles.planDetailLabel}>{label}: </span>
      <span className={styles.planDetailValue}>{value}</span>
    </p>
  </div>
);

export default PlansPage;