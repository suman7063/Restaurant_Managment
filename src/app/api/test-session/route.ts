import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tableId = searchParams.get('tableId') || 'test-table-123';
    const restaurantId = searchParams.get('restaurantId') || 'test-restaurant-456';
    const otp = searchParams.get('otp') || '123456';
    const customerName = searchParams.get('customerName') || 'John Doe';
    const customerPhone = searchParams.get('customerPhone') || '+1234567890';

    console.log('Testing session service with action:', action);

    let result: any = {};

    switch (action) {
      case 'create':
        result.session = await sessionService.createSession(tableId, restaurantId);
        break;

      case 'join':
        result.joinResult = await sessionService.joinSession(otp, tableId, {
          name: customerName,
          phone: customerPhone
        });
        break;

      case 'active':
        result.activeSession = await sessionService.getActiveSession(tableId);
        break;

      case 'customers':
        const session = await sessionService.getActiveSession(tableId);
        if (session) {
          result.customers = await sessionService.getSessionCustomers(session.id);
        }
        break;

      case 'orders':
        const activeSession = await sessionService.getActiveSession(tableId);
        if (activeSession) {
          result.orders = await sessionService.getSessionOrders(activeSession.id);
        }
        break;

      case 'regenerate':
        const currentSession = await sessionService.getActiveSession(tableId);
        if (currentSession) {
          result.newOtp = await sessionService.regenerateOTP(currentSession.id);
        }
        break;

      case 'update-total':
        const sessionToUpdate = await sessionService.getActiveSession(tableId);
        if (sessionToUpdate) {
          result.totalUpdated = await sessionService.updateSessionTotal(sessionToUpdate.id);
        }
        break;

      case 'close':
        const sessionToClose = await sessionService.getActiveSession(tableId);
        if (sessionToClose) {
          result.sessionClosed = await sessionService.closeSession(sessionToClose.id);
        }
        break;

      case 'clear':
        const sessionToClear = await sessionService.getActiveSession(tableId);
        if (sessionToClear) {
          result.sessionCleared = await sessionService.clearSession(sessionToClear.id);
        }
        break;

      default:
        // Test all operations
        result = {
          create: await sessionService.createSession(tableId, restaurantId),
          join: await sessionService.joinSession(otp, tableId, {
            name: customerName,
            phone: customerPhone
          }),
          active: await sessionService.getActiveSession(tableId),
          customers: [],
          orders: [],
          regenerate: null,
          updateTotal: false,
          close: false,
          clear: false
        };

        // Get customers and orders if session exists
        if (result.active) {
          result.customers = await sessionService.getSessionCustomers(result.active.id);
          result.orders = await sessionService.getSessionOrders(result.active.id);
          result.regenerate = await sessionService.regenerateOTP(result.active.id);
          result.updateTotal = await sessionService.updateSessionTotal(result.active.id);
          result.close = await sessionService.closeSession(result.active.id);
          result.clear = await sessionService.clearSession(result.active.id);
        }
    }

    return NextResponse.json({
      message: 'Session service test completed',
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test session API error:', error);
    return NextResponse.json({
      error: 'Session test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 