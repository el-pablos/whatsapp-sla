<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            // fix: tambahkan discount field untuk mendukung diskon order - 2026-03-24
            'discount' => ['nullable', 'numeric', 'min:0'],
        ];

        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules['customer_phone'][0] = 'sometimes';
            $rules['customer_name'][0] = 'sometimes';
            $rules['items'][0] = 'sometimes';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'customer_phone.required' => 'Nomor telepon customer wajib diisi.',
            'customer_name.required' => 'Nama customer wajib diisi.',
            'items.required' => 'Order harus memiliki minimal 1 item.',
            'items.min' => 'Order harus memiliki minimal 1 item.',
            'items.*.name.required' => 'Nama item wajib diisi.',
            'items.*.quantity.required' => 'Jumlah item wajib diisi.',
            'items.*.quantity.min' => 'Jumlah item minimal 1.',
            'items.*.price.required' => 'Harga item wajib diisi.',
            'items.*.price.min' => 'Harga item tidak boleh negatif.',
        ];
    }
}
