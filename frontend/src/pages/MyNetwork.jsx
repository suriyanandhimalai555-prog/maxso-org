
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { networkingStyles as ns } from '../styles';

const MyNetwork = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                const data = await api.get('/api/user/my-network');
                setTreeData(data);
            } catch (err) {
                console.error('Failed to fetch network', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNetwork();
    }, []);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));

    if (loading) {
        return (
            <div style={ns.networkContainer}>
                <PageHeader title="My Network" />
                <div style={ns.networkLoading}>Loading network...</div>
            </div>
        );
    }

    return (
        <div style={ns.networkContainer}>
            <PageHeader title="My Network" />

            {/* Zoom Controls */}
            <div style={ns.networkZoomControls}>
                <button onClick={handleZoomOut} style={ns.networkZoomBtn}>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>−</span> Zoom Out
                </button>
                <button onClick={handleZoomIn} style={ns.networkZoomBtn}>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>+</span> Zoom In
                </button>
            </div>

            {/* Tree Container */}
            <div style={ns.networkTreeWrapper}>
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
                    {treeData ? (
                        <TreeNode node={treeData} isRoot={true} />
                    ) : (
                        <div style={ns.networkNoData}>No network data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TreeNode = ({ node, isRoot = false }) => {
    const [collapsed, setCollapsed] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const childrenRowRef = React.useRef(null);
    const [hLine, setHLine] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (hasChildren && !collapsed && childrenRowRef.current && node.children.length > 1) {
            const children = childrenRowRef.current.children;
            if (children.length >= 2) {
                const first = children[0];
                const last = children[children.length - 1];
                const parentRect = childrenRowRef.current.getBoundingClientRect();
                const firstRect = first.getBoundingClientRect();
                const lastRect = last.getBoundingClientRect();
                const left = firstRect.left + firstRect.width / 2 - parentRect.left;
                const right = lastRect.left + lastRect.width / 2 - parentRect.left;
                setHLine({ left, width: right - left });
            }
        }
    }, [hasChildren, collapsed, node.children?.length]);

    return (
        <div style={ns.treeNodeContainer}>
            <div style={ns.treeNodeWrapper}>
                <div
                    onClick={() => hasChildren && setCollapsed(!collapsed)}
                    style={{
                        ...ns.treeNode,
                        ...(isRoot ? ns.treeNodeRoot : {}),
                        ...(!node.status ? ns.treeNodeInactive : {}),
                        ...(isRoot && !node.status ? ns.treeNodeRootInactive : {}),
                        cursor: hasChildren ? 'pointer' : 'default'
                    }}
                >
                    <span style={ns.treeNodeCode}>{node.referralCode}</span>
                    {node.name && <span style={ns.treeNodeName}>{node.name}</span>}
                </div>
            </div>

            {hasChildren && !collapsed && (
                <div style={ns.treeChildrenContainer}>
                    <div style={ns.treeLine}></div>
                    <div style={{ position: 'relative' }}>
                        {node.children.length > 1 && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: `${hLine.left}px`,
                                width: `${hLine.width}px`,
                                height: '2px',
                                background: '#4b5563',
                            }}></div>
                        )}
                        <div ref={childrenRowRef} style={ns.treeChildrenRow}>
                            {node.children.map((child, idx) => (
                                <div key={child.referralCode || idx} style={ns.treeChildBranch}>
                                    <div style={ns.treeLine}></div>
                                    <TreeNode node={child} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyNetwork;
