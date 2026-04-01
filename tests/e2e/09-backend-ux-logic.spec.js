import { test, expect } from '@playwright/test';

test.describe('UX Improvements & Backend Logic Verification', () => {

  let token = '';
  
  test.beforeAll(async ({ request }) => {
    // Login to get token
    const loginRes = await request.post('http://localhost:8076/api/auth/login', {
      data: {
        username: 'admin',
        password: 'password' // check if password is correct, usually 123456 or password
      }
    });
    // If it fails, we might need 'admin' / '123456'
    let body = await loginRes.json();
    if (body.code !== 200) {
      const loginRes2 = await request.post('http://localhost:8076/api/auth/login', {
        data: { username: 'admin', password: '123456' }
      });
      body = await loginRes2.json();
    }
    token = body.data.token;
  });

  test('TC-01: Backend JSR-303 Parameter Validation', async ({ request }) => {
    // Attempt to create a parking lot with totalSpaces = 0 (invalid per @Min(1))
    const res = await request.post('http://localhost:8076/api/parkings', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Validation Parking',
        address: 'Test Address',
        totalSpaces: 0, // Invalid!
        longitude: 116.397428,
        latitude: 39.90923
      }
    });
    
    expect(res.status()).toBe(400);
    const body = await res.json();
    console.log('TC-01 Validation Response:', body);
    expect(body.message).toContain('总车位数至少为1');
  });

  test('TC-03: Abnormal Occupation Fallback', async ({ request }) => {
    // 1. Create a parking lot
    const pRes = await request.post('http://localhost:8076/api/parkings', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Abnormal Test Parking',
        address: 'Address',
        totalSpaces: 10,
        longitude: 116.397428,
        latitude: 39.90923
      }
    });
    const parkingId = (await pRes.json()).data.id;

    // 2. Create a space
    const sRes = await request.post('http://localhost:8076/api/parking-spaces', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        parkingId: parkingId,
        spaceNumber: 'AB-001',
        spaceType: 1,
        sectionArea: 'A',
        floor: 1,
        status: 1
      }
    });
    const spaceId = (await sRes.json()).data.id;

    // 3. Simulate physical sensor changing space status to 2 (Occupied)
    const updateRes = await request.put(`http://localhost:8076/api/parking-spaces/${spaceId}/status?status=2`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(updateRes.status()).toBe(200);

    // 4. Verify that an abnormal entry record was created automatically
    const entriesRes = await request.get(`http://localhost:8076/api/vehicle-entry-exits/active/${parkingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const entries = (await entriesRes.json()).data;
    
    // Find the entry for this space
    const abnormalEntry = entries.find(e => e.spaceId === spaceId);
    expect(abnormalEntry).toBeDefined();
    expect(abnormalEntry.carNo).toContain('未知车辆_');
    console.log('TC-03 Abnormal Entry created:', abnormalEntry.carNo);
  });

  test('TC-02: Distributed Lock Anti-Oversell (Concurrency)', async ({ request }) => {
    // Create a new parking and space for concurrency test
    const pRes = await request.post('http://localhost:8076/api/parkings', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Concurrency Parking',
        address: 'Address',
        totalSpaces: 10,
        longitude: 116.0,
        latitude: 39.0
      }
    });
    const parkingId = (await pRes.json()).data.id;

    const sRes = await request.post('http://localhost:8076/api/parking-spaces', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        parkingId: parkingId,
        spaceNumber: 'CC-001',
        spaceType: 1,
        sectionArea: 'C',
        floor: 1,
        status: 1
      }
    });
    const spaceId = (await sRes.json()).data.id;

    // Make 10 concurrent reservation requests for the same space
    const promises = [];
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour later
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours later

    for(let i=0; i<10; i++) {
      promises.push(
        request.post('http://localhost:8076/api/reservations', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            parkingId: parkingId,
            parkingSpaceId: spaceId,
            carNo: `TEST-${i}`,
            userId: '1',
            startTime: startTime,
            endTime: endTime
          }
        }).then(res => res.json())
      );
    }

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.code === 200);
    const failures = results.filter(r => r.code !== 200);

    console.log(`TC-02 Concurrency Results: ${successes.length} successes, ${failures.length} failures.`);
    expect(successes.length).toBe(1); // Only 1 should succeed
    expect(failures.length).toBe(9);  // The rest should fail due to lock or time conflict
  });

});