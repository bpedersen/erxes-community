import { attachmentSchema, customFieldSchema, ICustomField } from './common';
import { Document, Schema } from 'mongoose';
import {
  field,
  getDateFieldDefinition,
  schemaHooksWrapper,
  schemaWrapper
} from './utils';
import {
  PRODUCT_CATEGORY_STATUSES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES
} from './constants';

interface IAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ISubUom {
  uomId: string;
  ratio: number;
}
interface IProductCommonFields {
  name: string;
  code: string;
  description?: string;
  attachment?: IAttachment;
  tokens: string[];
}

export interface IPrice {
  [token: string]: number;
}

export interface IProduct extends IProductCommonFields {
  categoryId?: string;
  type?: string;
  sku?: string;
  barcodes?: string[];
  barcodeDescription?: string;
  prices: IPrice;
  customFieldsData?: ICustomField[];
  tagIds?: string[];
  status?: string;
  vendorId?: string;
  vendorCode?: string;
  mergedIds?: string[];
  attachmentMore?: IAttachment[];
  uomId?: string;
  subUoms?: ISubUom[];
  taxType?: string;
  taxCode?: string;
}

export interface IProductDocument extends IProduct, Document {
  _id: string;
  createdAt: Date;
  tokens: string[];
}

export interface IProductCategory extends IProductCommonFields {
  order: string;
  parentId?: string;
  status: string;
}

export interface IProductCategoryDocument extends IProductCategory, Document {
  _id: string;
  createdAt: Date;
  tokens: string[];
}

const subUomSchema = new Schema({
  _id: field({ pkey: true }),
  uomId: field({ type: String, label: 'Sub unit of measurement' }),
  ratio: field({ type: Number, label: 'ratio of sub uom to main uom' })
});

export const productSchema = schemaWrapper(
  new Schema({
    _id: field({ pkey: true }),
    categoryId: field({ type: String, label: 'Category' }),
    name: field({ type: String, label: 'Name' }),
    code: field({ type: String, label: 'Code' }),
    barcodes: field({
      type: [String],
      optional: true,
      label: 'Barcodes',
      index: true
    }),
    barcodeDescription: field({
      type: String,
      optional: true,
      label: 'Barcode Description'
    }),
    description: field({ type: String, optional: true, label: 'Description' }),
    attachment: field({ type: attachmentSchema }),
    createdAt: getDateFieldDefinition('Created at'),
    type: field({
      type: String,
      enum: PRODUCT_TYPES.ALL,
      default: PRODUCT_TYPES.PRODUCT,
      label: 'Type'
    }),
    tagIds: field({
      type: [String],
      optional: true,
      label: 'Tags',
      index: true
    }),
    sku: field({
      type: String,
      optional: true,
      label: 'Stock keeping unit',
      default: 'ш'
    }),
    uomId: field({
      type: String,
      optional: true,
      label: 'Main unit of measurement'
    }),
    subUoms: field({
      type: [subUomSchema],
      optional: true,
      label: 'Sum unit of measurements'
    }),
    prices: field({
      type: Object,
      label: 'Unit price by token'
    }),
    customFieldsData: field({
      type: [customFieldSchema],
      optional: true,
      label: 'Custom fields data'
    }),
    status: field({
      type: String,
      enum: PRODUCT_STATUSES.ALL,
      optional: true,
      label: 'Status',
      default: 'active',
      esType: 'keyword',
      index: true
    }),
    vendorId: field({ type: String, optional: true, label: 'Vendor' }),
    mergedIds: field({ type: [String], optional: true }),
    attachmentMore: field({ type: [attachmentSchema] }),
    tokens: field({ type: [String] }),
    taxType: field({ type: String, optional: true, label: 'VAT type' }),
    taxCode: field({ type: String, optional: true, label: '' })
  })
);

export const productCategorySchema = schemaHooksWrapper(
  new Schema({
    _id: field({ pkey: true }),
    order: field({ type: String, label: 'Order' }),
    parentId: field({ type: String, optional: true, label: 'Parent' }),
    name: field({ type: String, label: 'Name' }),
    code: field({ type: String, label: 'Code' }),
    description: field({ type: String, optional: true, label: 'Description' }),
    meta: field({ type: String, optional: true, label: 'Meta' }),
    attachment: field({ type: attachmentSchema }),
    status: field({
      type: String,
      enum: PRODUCT_CATEGORY_STATUSES.ALL,
      optional: true,
      label: 'Status',
      default: 'active',
      esType: 'keyword',
      index: true
    }),
    createdAt: getDateFieldDefinition('Created at'),
    tokens: field({ type: [String] })
  }),
  'erxes_productCategorySchema'
);
