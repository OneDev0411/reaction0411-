/* eslint dot-notation: 0 */
/* eslint no-loop-func: 0 */
import { Meteor } from "meteor/meteor";
import { Factory } from "meteor/dburles:factory";
import { Reaction } from "/server/api";
import { Products, Tags } from "/lib/collections";
import { expect } from "meteor/practicalmeteor:chai";
import { sinon } from "meteor/practicalmeteor:sinon";
import { Roles } from "meteor/alanning:roles";
import { _ } from "underscore";
import { addProduct } from "/server/imports/fixtures/products";
import Fixtures from "/server/imports/fixtures";

Fixtures();

before(function () {
  this.timeout(6000);
  Meteor._sleepForMs(500);
});

describe("core product methods", function () {
  // we can't clean Products collection after each test from now, because we
  // have functions which called from async db operations callbacks. So, if we
  // clean collections each time - we could have a situation when next test
  // started, but previous not yet finished his async computations.
  // So, if you need to clean the collection for your test, you could try to do
  // it, but this is not recommended in droves
  let sandbox;
  let updateStub;
  let removeStub;
  let insertStub;

  before(function () {
    // We are mocking inventory hooks, because we don't need them here, but
    // if you want to do a real stress test, you could try to comment out
    // this three lines. This is needed only for ./reaction test. In one
    // package test this is ignoring.
    if (Array.isArray(Products._hookAspects.remove.after) && Products._hookAspects.remove.after.length) {
      updateStub = sinon.stub(Products._hookAspects.update.after[0], "aspect");
      removeStub = sinon.stub(Products._hookAspects.remove.after[0], "aspect");
      insertStub = sinon.stub(Products._hookAspects.insert.after[0], "aspect");
    }
    Products.direct.remove({});
  });

  after(function () {
    if (updateStub) {
      updateStub.restore();
      removeStub.restore();
      insertStub.restore();
    }
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("products/cloneVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Roles, "userIsInRole", () => false);
      let insertProductSpy = sandbox.spy(Products, "insert");
      expect(() => Meteor.call("products/cloneVariant",
        "fakeId", "fakeVarId")).to.throw(Meteor.Error, /Access Denied/);
      expect(insertProductSpy).to.not.have.been.called;
    });

    it("should clone variant by admin", function (done) {
      sandbox.stub(Roles, "userIsInRole", () => true);
      const product = addProduct();
      let variants = Products.find({ancestors: [product._id]}).fetch();
      expect(variants.length).to.equal(1);
      Meteor.call("products/cloneVariant", product._id, variants[0]._id);
      variants = Products.find({ancestors: [product._id]}).count();
      expect(variants).to.equal(2);
      return done();
    });

    it("number of `child variants` between source and cloned `variants` should be equal", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      const variant = Products.find({ancestors: [product._id]}).fetch();
      let optionCount = Products.find({ ancestors: {
        $in: [variant[0]._id]
      }}).count();
      expect(optionCount).to.equal(2);

      Meteor.call("products/cloneVariant", product._id, variant[0]._id);
      const variants = Products.find({ancestors: [product._id]}).fetch();
      const clonedVariant = variants.filter(v => v._id !== variant[0]._id);
      expect(variant[0]._id).to.not.equal(clonedVariant[0]._id);
      expect(_.isEqual(variant[0].ancestors, clonedVariant[0].ancestors)).to.be.true;
      // expect(variant[0].ancestors).to.equal(clonedVariant[0].ancestors);

      optionCount = Products.find({ ancestors: {$in: [clonedVariant[0]._id]}}).count();
      expect(optionCount).to.equal(2);
    });
  });

  describe("products/createVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/createVariant", "fakeId")).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should create top level variant", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      let variants = Products.find({ancestors: [product._id]}).fetch();
      expect(variants.length).to.equal(1);
      Meteor.call("products/createVariant", product._id);
      variants = Products.find({ancestors: [product._id]}).fetch();
      expect(variants.length).to.equal(2);
      return done();
    });

    it("should create option variant", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let options;
      const product = addProduct();
      const variant = Products.find({ ancestors: [product._id] }).fetch()[0];
      options = Products.find({
        ancestors: { $in: [variant._id] }
      }).fetch();
      expect(options.length).to.equal(2);

      Meteor.call("products/createVariant", variant._id);
      options = Products.find({
        ancestors: { $in: [variant._id] }
      }).fetch();
      expect(options.length).to.equal(3);

      return done();
    });

    it("should create variant with predefined object", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      const newVariant = {
        title: "newVariant"
      };
      let variants = Products.find({ ancestors: [product._id] }).fetch();
      const firstVariantId = variants[0]._id;
      expect(variants.length).to.equal(1);

      Meteor.call("products/createVariant", product._id, newVariant);
      variants = Products.find({ ancestors: [product._id] }).fetch();
      const createdVariant = variants.filter(v => v._id !== firstVariantId);
      expect(variants.length).to.equal(2);
      expect(createdVariant[0].title).to.equal("newVariant");
      return done();
    });
  });

  describe("products/updateVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.stub(Products, "update");
      expect(() => Meteor.call("products/updateVariant", { _id: "fakeId" })).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should update individual variant by admin passing in full object", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      let variant = Products.find({ ancestors: [product._id] }).fetch()[0];
      variant["title"] = "Updated Title";
      variant["price"] = 7;
      Meteor.call("products/updateVariant", variant);
      variant = Products.find({ ancestors: [product._id] }).fetch()[0];
      expect(variant.price).to.equal(7);
      expect(variant.title).to.equal("Updated Title");

      return done();
    });

    it("should update individual variant by admin passing in partial object", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let updatedVariant;
      const product = addProduct();
      let variant = Products.find({ ancestors: [product._id] }).fetch()[0];
      Meteor.call("products/updateVariant", {
        _id: variant._id,
        title: "Updated Title",
        price: 7
      });
      updatedVariant = Products.findOne(variant._id);
      expect(updatedVariant.price).to.equal(7);
      expect(updatedVariant.title).to.equal("Updated Title");
      expect(updatedVariant.optionTitle).to.equal(variant.optionTitle);
    });
  });

  describe("products/deleteVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let removeProductSpy = sandbox.spy(Products, "remove");
      expect(() => Meteor.call("products/deleteVariant", "fakeId")).to.throw(Meteor.Error, /Access Denied/);
      expect(removeProductSpy).to.not.have.been.called;
    });

    it("should delete top-level variant", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      let variant = Products.find({ ancestors: [product._id] }).fetch();
      expect(variant.length).to.equal(1);
      Meteor.call("products/deleteVariant", variant[0]._id);
      variant = Products.find({ ancestors: [product._id] }).fetch();
      expect(variant.length).to.equal(0);
    });

    it("should delete all child variants (options) if top-level variant deleted", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      const variant = Products.find({ ancestors: [product._id] }).fetch()[0];
      let variants = Products.find({ ancestors: {
        $in: [variant._id]
      }}).fetch();
      expect(variants.length).to.equal(2);
      Meteor.call("products/deleteVariant", variant._id);
    });
  });

  describe("products/cloneProduct", function () {
    // At the moment we do not have any mechanisms that track the product
    // cloning hierarchy, so the only way to track that will be cleaning
    // collection on before each test.
    beforeEach(function () {
      return Products.direct.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      sandbox.stub(Meteor.server.method_handlers, "inventory/remove", function () {
        check(arguments, [Match.Any]);
      });
      let insertProductSpy = sandbox.spy(Products, "insert");
      expect(() => Meteor.call("products/cloneProduct", {})).to.throw(Meteor.Error, /Access Denied/);
      expect(insertProductSpy).to.not.have.been.called;
    });

    it("should clone product", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      sandbox.stub(Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      const product = addProduct();
      let productCloned;
      expect(Products.find({ type: "simple" }).count()).to.equal(1);
      Meteor.call("products/cloneProduct", product);
      expect(Products.find({ type: "simple" }).count()).to.equal(2);
      productCloned = Products.find({
        _id: {
          $ne: product._id
        },
        type: "simple"
      }).fetch()[0];
      expect(productCloned.title).to.equal(product.title + "-copy");
      expect(productCloned.handle).to.equal(product.handle + "-copy");
      expect(productCloned.pageTitle).to.equal(product.pageTitle);
      expect(productCloned.description).to.equal(product.description);

      return done();
    });

    it("product should be cloned with all variants and child variants with equal data, but not the same `_id`s",
      function (done) {
        sandbox.stub(Reaction, "hasPermission", () => true);
        sandbox.stub(Meteor.server.method_handlers, "inventory/register", function () {
          check(arguments, [Match.Any]);
        });
        const product = addProduct();
        let variants = Products.find({ ancestors: { $in: [product._id] } }).fetch();
        expect(variants.length).to.equal(3);
        Meteor.call("products/cloneProduct", product);
        const clone = Products.find({
          _id: {
            $ne: product._id
          },
          type: "simple"
        }).fetch()[0];
        let cloneVariants = Products.find({
          ancestors: { $in: [clone._id] }
        }).fetch();
        expect(cloneVariants.length).to.equal(3);
        for (let i = 0; i < variants.length; i++) {
          expect(cloneVariants.some(clonedVariant => {
            return clonedVariant.title === variants[i].title;
          })).to.be.ok;
        }

        return done();
      }
    );

    it("product group cloning should create the same number of new products", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      sandbox.stub(Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      const product = addProduct();
      const product2 = addProduct();
      Meteor.call("products/cloneProduct", [product, product2]);
      const clones = Products.find({
        _id: {
          $nin: [product._id, product2._id]
        },
        type: "simple"
      }).fetch();
      expect(clones.length).to.equal(2);

      return done();
    });

    it("product group cloning should create the same number of cloned variants", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      sandbox.stub(Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      const product = addProduct();
      const product2 = addProduct();
      const variants = Products.find({
        ancestors: { $in: [product._id, product2._id] }
      }).count();
      Meteor.call("products/cloneProduct", [product, product2]);
      const clones = Products.find({
        _id: {
          $nin: [product._id, product2._id]
        },
        type: "simple"
      }).fetch();
      expect(clones.length).to.equal(2);
      const clonedVariants = Products.find({
        ancestors: { $in: [clones[0]._id, clones[1]._id] }
      }).count();
      expect(clonedVariants).to.equal(variants);

      return done();
    });
  });

  describe("createProduct", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let insertProductSpy = sandbox.spy(Products, "insert");
      expect(() => Meteor.call("products/createProduct")).to.throw(Meteor.Error, /Access Denied/);
      expect(insertProductSpy).to.not.have.been.called;
    });

    it("should create new product", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let insertProductSpy = sandbox.stub(Products, "insert", () => 1);
      expect(Meteor.call("products/createProduct")).to.equal(1);
      expect(insertProductSpy).to.have.been.called;
    });

    it("should create variant with new product", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      Meteor.call("products/createProduct", (error, result) => {
        if (result) {
          // this test successfully finds product variant only by such way
          Meteor.setTimeout(() => {
            expect(Products.find({ancestors: [result]}).count()).to.equal(1);
            return done();
          }, 50);
        }
      });
    });
  });

  describe("deleteProduct", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let removeProductSpy = sandbox.spy(Products, "remove");
      expect(() => Meteor.call("products/deleteProduct", "fakeId")).to.throw(Meteor.Error, /Access Denied/);
      expect(removeProductSpy).to.not.have.been.called;
    });

    it("should delete product by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      // we expect "4" because we have 1 product and 3 variants
      expect(Meteor.call("products/deleteProduct", product._id)).to.equal(4);
      expect(Products.find(product._id).count()).to.equal(0);
    });

    it("should throw error if removal fails", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      sandbox.stub(Products, "remove");
      expect(() => Meteor.call("products/deleteProduct", product._id)).to.throw(Meteor.Error,
        /Something goes wrong, nothing was deleted/);
      expect(Products.find(product._id).count()).to.equal(1);
    });
  });

  describe("updateProductField", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/updateProductField",
          "fakeId", "title", "Updated Title")).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should update product field by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      Meteor.call("products/updateProductField", product._id, "title", "Updated Title");
      product = Products.findOne(product._id);
      expect(product.title).to.equal("Updated Title");
    });

    it("should update variant fields", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      let variant = Products.findOne({ ancestors: [product._id] });
      Meteor.call("products/updateProductField", variant._id, "title", "Updated Title");
      variant = Products.findOne(variant._id);
      expect(variant.title).to.equal("Updated Title");
    });
  });

  describe("updateProductTags", function () {
    beforeEach(function () {
      return Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      let insertTagsSpy = sandbox.spy(Tags, "insert");
      expect(() => Meteor.call("products/updateProductTags", "fakeId", "productTag", null)).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
      expect(insertTagsSpy).to.not.have.been.called;
    });

    it("should add new tag when passed tag name and null ID by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let tagName = "Product Tag";
      expect(Tags.findOne({ name: tagName})).to.be.undefined;
      Meteor.call("products/updateProductTags", product._id, tagName, null);
      const tag = Tags.findOne({ name: tagName });
      expect(tag.slug).to.equal(Reaction.getSlug(tagName));
      product = Products.findOne(product._id);
      expect(product.hashtags).to.contain(tag._id);
    });

    it("should add existing tag when passed existing tag and tag._id by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let tag = Factory.create("tag");
      expect(Tags.find().count()).to.equal(1);
      expect(product.hashtags).to.not.contain(tag._id);
      Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      expect(Tags.find().count()).to.equal(1);
      product = Products.findOne(product._id);
      expect(product.hashtags).to.contain(tag._id);
    });
  });

  describe("removeProductTag", function () {
    beforeEach(function () {
      return Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      let removeTagsSpy = sandbox.spy(Tags, "remove");
      expect(() => Meteor.call("products/removeProductTag",
        "fakeId", "tagId")).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
      expect(removeTagsSpy).to.not.have.been.called;
    });

    it("should remove product tag by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let tag = Factory.create("tag");
      Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      product = Products.findOne(product._id);
      expect(product.hashtags).to.contain(tag._id);
      expect(Tags.find().count()).to.equal(1);
      Meteor.call("products/removeProductTag", product._id, tag._id);
      product = Products.findOne(product._id);
      expect(product.hashtags).to.not.contain(tag._id);
      expect(Tags.find().count()).to.equal(0);
    });
  });

  describe("setHandle", () => {
    beforeEach(() => {
      return Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let productUpdateSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/setHandle", "fakeId"))
        .to.throw(Meteor.Error, /Access Denied/);
      expect(productUpdateSpy).to.not.have.been.called;
    });

    it("should set handle for product by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      const productHandle = product.handle;
      Meteor.call("products/updateProductField", product._id, "title", "new product name");
      Meteor.call("products/setHandle", product._id);
      product = Products.findOne(product._id);
      expect(product.handle).to.not.equal(productHandle);
    });

    it("should set handle correctly", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      Meteor.call("products/setHandle", product._id);
      product = Products.findOne(product._id);
      expect(product.handle).to.equal("new-second-product-name");
    });

    it("products with the same title should receive correct handle", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      Meteor.call("products/setHandle", product._id);
      product = Products.findOne(product._id);
      expect(product.handle).to.equal("new-second-product-name-copy");
    });
  });

  describe("setHandleTag", function () {
    beforeEach(function () {
      return Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(function () {
        return Meteor.call("products/setHandleTag", "fakeId", "tagId");
      }).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should set handle tag for product by admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let tag = Factory.create("tag");
      Meteor.call("products/setHandleTag", product._id, tag._id);
      product = Products.findOne(product._id);
      expect(product.handle).to.equal(tag.slug);
    });
  });

  describe("updateProductPosition", function () {
    beforeEach(function () {
      return Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/updateProductPosition",
        "fakeId", {}, "tag")).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should update product position by admin", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      const tag = Factory.create("tag");
      const position = {
        position: 0,
        weight: 0,
        updatedAt: new Date()
      };
      expect(() => Meteor.call("products/updateProductPosition",
          product._id, position, tag.slug)).to.not.throw(Meteor.Error, /Access Denied/);
      const updatedProduct = Products.findOne(product._id);
      expect(updatedProduct.positions[tag.slug].position).to.equal(0);

      return done();
    });
  });

  describe("updateMetaFields position", () => {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/updateVariantsPosition", ["fakeId"])).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should update variants position", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      const product = addProduct();
      const product2 = addProduct();
      const product3 = addProduct();

      expect(product.index).to.be.undefined;
      expect(product2.index).to.be.undefined;
      expect(product3.index).to.be.undefined;

      Meteor.call("products/updateVariantsPosition", [
        product2._id, product3._id, product._id
      ]);
      const modifiedProduct = Products.findOne(product._id);
      const modifiedProduct2 = Products.findOne(product2._id);
      const modifiedProduct3 = Products.findOne(product3._id);
      expect(modifiedProduct.index).to.equal(2);
      expect(modifiedProduct2.index).to.equal(0);
      expect(modifiedProduct3.index).to.equal(1);
    });
  });

  describe("updateMetaFields", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/updateMetaFields", "fakeId", {
        key: "Material",
        value: "Spandex"
      })).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should add meta fields by admin", function (done) {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      Meteor.call("products/updateMetaFields", product._id, {
        key: "Material",
        value: "Spandex"
      });
      product = Products.findOne(product._id);
      expect(product.metafields[0].key).to.equal("Material");
      expect(product.metafields[0].value).to.equal("Spandex");

      return done();
    });
  });

  describe("publishProduct", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(Reaction, "hasPermission", () => false);
      let updateProductSpy = sandbox.spy(Products, "update");
      expect(() => Meteor.call("products/publishProduct", "fakeId")).to.throw(Meteor.Error, /Access Denied/);
      expect(updateProductSpy).to.not.have.been.called;
    });

    it("should let admin publish product", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let isVisible = product.isVisible;
      expect(() => Meteor.call("products/publishProduct", product._id)).to.not.throw(Meteor.Error, /Access Denied/);
      product = Products.findOne(product._id);
      expect(product.isVisible).to.equal(!isVisible);
    });

    it("should let admin toggle product visibility", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let isVisible = product.isVisible;
      expect(() => Meteor.call("products/publishProduct", product._id)).to.not.throw(Meteor.Error, /Access Denied/);
      product = Products.findOne(product._id);
      expect(product.isVisible).to.equal(!isVisible);
      expect(() => Meteor.call("products/publishProduct", product._id)).to.not.throw(Meteor.Error, /Bad Request/);
      product = Products.findOne(product._id);
      expect(product.isVisible).to.equal(isVisible);
    });

    it("should not publish product when missing title", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      let isVisible = product.isVisible;
      Products.update(product._id, {
        $set: {
          title: ""
        }
      }, {
        selector: { type: "simple" },
        validate: false
      });
      expect(() => Meteor.call("products/publishProduct", product._id)).to.not.throw(Meteor.Error, /Access Denied/);
      product = Products.findOne(product._id);
      expect(product.isVisible).to.equal(isVisible);
    });

    it("should not publish product when missing even one of child variant price", function () {
      sandbox.stub(Reaction, "hasPermission", () => true);
      let product = addProduct();
      const isVisible = product.isVisible;
      let variant = Products.findOne({ancestors: [product._id]});
      expect(variant.ancestors[0]).to.equal(product._id);
      let options = Products.find({
        ancestors: [product._id, variant._id]
      }).fetch();
      expect(options.length).to.equal(2);
      Products.update(options[0]._id, {
        $set: {
          price: 0
        }
      }, {
        selector: { type: "variant" },
        validate: false
      });
      expect(() => Meteor.call("products/publishProduct", product._id)).to.throw(Meteor.Error, /Forbidden/);
      product = Products.findOne(product._id);
      expect(product.isVisible).to.equal(isVisible);
    });

    it.skip("should not publish product when top variant has no children and no price", function (done) {
      return done();
    });

    it("should not publish product when missing variant", function () {
      let product = addProduct();
      let isVisible = product.isVisible;
      sandbox.stub(Roles, "userIsInRole", () => true);
      Products.remove({ancestors: { $in: [product._id] }});
      expect(() => Meteor.call("products/publishProduct", product._id)).to.throw(Meteor.Error, /Forbidden/);
      product = Products.findOne(product._id);
      expect(product.isVisible).to.equal(isVisible);
    });
  });
});

