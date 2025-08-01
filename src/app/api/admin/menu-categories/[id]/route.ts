import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

// PUT - Update a menu category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const body = await request.json();
    const { name, description, display_order, is_active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: category, error } = await supabase
      .from('restaurant_menu_categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu category:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update menu category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Exception in PUT /api/admin/menu-categories/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a menu category (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;

    const { error } = await supabase
      .from('restaurant_menu_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting menu category:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete menu category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Menu category deleted successfully'
    });
  } catch (error) {
    console.error('Exception in DELETE /api/admin/menu-categories/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 