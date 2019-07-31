// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex:1,
    page:1,
    list:[],
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    var goods_id = options.goods_id;
    // var goods_id = '2';
    self.not_used(goods_id);
    self.setData({
      goods_id: goods_id,
    })
  },
  //未使用
  not_used: function (goods_id){
    var self = this;
    var key = wx.getStorageSync('key');
    if (!goods_id){
      self.data.goods_id;
    }else{
      var goods_id = goods_id;
    }
    var page = self.data.page;
    var orderlist = self.data.list;
    wx.request({
      url: curl + 'api.php/orders/commentlist',
      data: { key: key, page: page, goods_id: goods_id},
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          var list = orderlist.concat(res.data.data.orderlist);
          if (res.data.data.orderlist.length == 10){
            console.log(1111);
            var is_seare = true;
            page++;
          }else{
            var is_seare = false;
          }
          self.setData({
            list:list,
            is_seare: is_seare,
            page:page,
          });
        }
        
      }
    })
  },
  //已使用
  already_used: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/coupon/lists/status/2?key=' + key,
      method: 'GET',
      success: function (res) {
        if (res.data.code == 0) {
          console.log(res);
          var list = res.data.data.list;
          self.setData({
            list: list,
          });
        }

      }
    })
  },
  //已失效
  failure: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/coupon/lists/status/3?key=' + key,
      method: 'GET',
      success: function (res) {
        if (res.data.code == 0) {
          console.log(res);
          var list = res.data.data.list;
          self.setData({
            list: list,
          });
        }

      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  lookImage(e) {
    var img =  e.currentTarget.dataset.img;
    var image = img.substring(0,img.length - 11)
    var src = e.currentTarget.dataset.src;
    var dizhi = [];
    src.forEach(function (dataOne) {
      dataOne = dataOne.substring(0,dataOne.length - 11);
      dizhi.push(dataOne)
    });
    wx.previewImage({
      current: image,
      urls: dizhi
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if(this.data.is_seare){
      this.not_used(this.data.goods_id);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})