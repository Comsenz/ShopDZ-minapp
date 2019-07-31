import { promisify } from '../../utils/promise.util'
import { $init, $digest } from '../../utils/common.util'
// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 1,
    list: [],
    id:null,
    contentCount: 0,
    order_sn:null,
    member_id:null,
    is_display:true,
    is_tijiao:false,
    name: null,
    time: null,
    is_evaluation:false,
    geval_image: [],
    images: []
  },
  handleContentInput(e) {
    const value = e.detail.value
    this.data.content = value
    this.data.contentCount = value.length
    $digest(this)
  },
  //获取用户所以收藏
  getList: function (order_sn){
    var self = this;
    var key = wx.getStorageSync('key');
    // key = '608095f5b268e5c4f1a6f63de19b0ebf';
    wx.request({
      url: curl +'api.php/orders/orderdetails',
      data: { key: key, order_sn: order_sn},
      method: 'GET',
      success:function(res){
        console.log(res);
        if(res.data.code == 0){
          var orderlist = res.data.data.gooddetails;
          console.log(orderlist);
          self.setData({
            list: orderlist,
            order_sn:order_sn,
          });
        }
      }
    })
  },
  chooseImage(e) {
    var slef = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        var tempFilePaths = res.tempFilePaths;
        var uploadImgCount = 0;
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempFilePaths[0],
          encoding: 'base64',
          success: function (data) {
            var img = data.data;
            slef.refundimg(img);
          }
        });
        $digest(this)
      }
    })
  },
  refundimg: function (img) {
    var self = this;
    var base64_string = img;
    var key = wx.getStorageSync('key');
    var data = {
      type: 'evaluate',
      key: key,
      base64_string: base64_string
    }
    wx.request({
      url: curl + 'api.php/Presales/refundimg',
      data: data,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        if (res.data.code == 0) {
          var url = res.data.data.url;
          var images = self.data.images.concat(url)
          if (images.length <= 3) {
            self.setData({
              images: images
            });

            console.log(images.length);
          } else {
            wx.showToast({
              title: '不能过于三张',
              icon: 'success',
              duration: 2000
            });
          }
        }
      }
    })
  },
  //删除图片
  removeImage(e) {
    const idx = e.target.dataset.idx

    if(idx == 2){
      var img = this.data.images;
      img.pop();
      this.setData({
        images:img,
      })
    }
    if(this.data.images.length == 1){
      this.setData({
        images:[],
      })
    }else{
      this.data.images.splice(idx, 1)
    }
    $digest(this)
  },
  submitForm: function (e) {
    var self = this;
    console.log(e);
    var rec_id = e.currentTarget.dataset.id;
    var key = wx.getStorageSync('key');
    var message = self.data.content;
    var img = self.data.images;
    if (!img.length > 0) {
      console.log('评价图片不能为空');
      wx.showToast({
        title: "评价图片不能为空",
        icon: 'none',
        duration: 2000
      })
      return;
    }
    if (!message) {
      wx.showToast({
        title: "退货内容不能为空",
        icon: 'none',
        duration: 2000
      })
      console.log('退货内容不能为空');
      return;
    }

    var test = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g;
    if (message.match(test)){
      wx.showToast({
        title: '不能使用emoji表情',
        icon: 'none',
      })
      return
    }
    var params_wx = {
      rec_id: rec_id,
      message: message,
      img1: img[0],
      img2: img[1],
      img3: img[2],
      key: key,
      type: 1,
    };
    if (params_wx) {
      wx.request({
        url: curl + 'api.php/orders/evaluate',
        data: params_wx,
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8' // 默认值
        },
        success: function (res) {
          if(res.data.code == 0){
            wx.showToast({
              title: "评价成功",
              icon: 'success',
              duration: 2000
            })
            self.getList(self.data.order_sn);
            self.setData({
              is_tijiao: false,
              is_display: true
            })
          }
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var order_sn = options.order_sn;
    // var order_sn = '201906141556080600';
    this.getList(order_sn);
    $init(this);
  },
  //点击随便逛逛返回首页
  jump:function(){
    wx.switchTab({
      url: '../index/index',
    });
  },
  block:function(e){
    var key = e.currentTarget.dataset.key;
    var self = this;
    self.setData({
      is_display:false,
      is_evaluation:false,
      is_tijiao:true,
      key:key,
    })
  },
  evaluation:function(e){
    var self =  this;
    var rec_id = e.currentTarget.dataset.id;
    var order_sn = self.data.order_sn;
    var key = wx.getStorageSync('key');

    wx.request({
      url: curl +'api.php/orders/myevaluate',
      data: { key: key, rec_id: rec_id, order_sn: order_sn},
      method:'GET',
      success:function(res){
        console.log(res);
        if(res.data.code == 0){
          var name = res.data.data.comment.geval_content;
          var time = res.data.data.comment.geval_addtime_text;
          var img = res.data.data.comment.geval_image;
          self.setData({
            name:name,
            time:time,
            geval_image:img,
            is_evaluation:true,
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})