require('dotenv').config({ path: '../.env' });
const db = require('../db');
const fs = require('fs');

async function testTree() {
    try {
        const myCode = 'MAX49634'; // Latha, admin/top user often tested
        const myName = 'Latha';

        const allLinksRes = await db.query(`
      SELECT r.referrer_code, r.referred_code, r.created_at, u.name as referred_name
      FROM "Referral" r
      JOIN "User" u ON r.referred_code = u.referral_code
      WHERE r.level = 1
      ORDER BY r.created_at ASC
    `);

        const childrenMap = {};
        for (const row of allLinksRes.rows) {
            if (!childrenMap[row.referrer_code]) {
                childrenMap[row.referrer_code] = [];
            }
            childrenMap[row.referrer_code].push({
                name: row.referred_name,
                referralCode: row.referred_code
            });
        }

        let maxFoundDepth = 0;

        const buildTreeMem = (referralCode, userName, currentDepth = 0) => {
            if (currentDepth > maxFoundDepth) maxFoundDepth = currentDepth;

            const node = {
                name: userName,
                referralCode: referralCode,
                depth: currentDepth,
                children: []
            };

            const directChildren = childrenMap[referralCode] || [];
            for (const child of directChildren) {
                node.children.push(buildTreeMem(child.referralCode, child.name, currentDepth + 1));
            }

            return node;
        };

        const tree = buildTreeMem(myCode, myName);
        console.log("Max depth found in tree:", maxFoundDepth);

        fs.writeFileSync('tree_test.json', JSON.stringify(tree, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

testTree();
